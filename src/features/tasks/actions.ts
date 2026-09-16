"use server";

import { addDays, format, getDay } from "date-fns";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAppUser, requireNotExternal } from "@/lib/auth/server";
import type {
  Task,
  TaskChecklistItem,
  TaskOccurrence,
  TaskOccurrenceChecklistItem,
  TaskRecurrence,
  TaskType,
  WeekDay,
} from "@/types";

const OCCURRENCE_HORIZON_DAYS = 14;

function householdTasks(householdId: string) {
  return adminDb().collection("households").doc(householdId).collection("tasks");
}

function householdOccurrences(householdId: string) {
  return adminDb().collection("households").doc(householdId).collection("taskOccurrences");
}

function buildChecklistItems(labels: string[]): TaskChecklistItem[] {
  return labels
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ id: crypto.randomUUID(), label }));
}

function snapshotChecklist(items: TaskChecklistItem[]): TaskOccurrenceChecklistItem[] {
  return items.map((item) => ({ ...item, checked: false }));
}

export async function createTask(input: {
  idToken: string;
  title: string;
  description?: string;
  assignedTo: string;
  points: number;
  type: TaskType;
  dueDate?: string; // yyyy-MM-dd, requerido si type === "once"
  recurrence?: TaskRecurrence; // requerido si type === "recurring"
  checklistItems?: string[];
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  if (input.type === "once" && !input.dueDate) {
    throw new AuthError("Falta la fecha de la tarea.");
  }
  if (input.type === "recurring" && (!input.recurrence || input.recurrence.daysOfWeek.length === 0)) {
    throw new AuthError("Selecciona al menos un día de la semana.");
  }

  const checklistItems = buildChecklistItems(input.checklistItems ?? []);
  const taskRef = householdTasks(requester.householdId).doc();
  await taskRef.set({
    title: input.title,
    description: input.description ?? "",
    assignedTo: input.assignedTo,
    createdBy: requester.id,
    points: input.points,
    type: input.type,
    ...(input.type === "once"
      ? { dueDate: new Date(`${input.dueDate}T00:00:00`) }
      : { recurrence: input.recurrence }),
    ...(checklistItems.length > 0 ? { checklistItems } : {}),
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  const occurrenceExtras = {
    description: input.description?.trim() || undefined,
    checklist: checklistItems.length > 0 ? snapshotChecklist(checklistItems) : undefined,
  };

  if (input.type === "once" && input.dueDate) {
    await householdOccurrences(requester.householdId)
      .doc(`${taskRef.id}_${input.dueDate}`)
      .set(
        buildOccurrence(
          taskRef.id,
          input.title,
          input.assignedTo,
          input.points,
          input.dueDate,
          occurrenceExtras,
        ),
      );
  } else if (input.recurrence) {
    await generateOccurrencesForTask(
      requester.householdId,
      taskRef.id,
      input.title,
      input.assignedTo,
      input.points,
      input.recurrence,
      occurrenceExtras,
    );
  }

  return { taskId: taskRef.id };
}

function buildOccurrence(
  taskId: string,
  title: string,
  assignedTo: string,
  points: number,
  date: string,
  extras?: { description?: string; checklist?: TaskOccurrenceChecklistItem[] },
): Omit<TaskOccurrence, "id"> {
  return {
    taskId,
    title,
    assignedTo,
    points,
    date,
    status: "pending",
    ...(extras?.description ? { description: extras.description } : {}),
    ...(extras?.checklist?.length ? { checklist: extras.checklist } : {}),
    createdAt: FieldValue.serverTimestamp() as unknown as TaskOccurrence["createdAt"],
  };
}

async function generateOccurrencesForTask(
  householdId: string,
  taskId: string,
  title: string,
  assignedTo: string,
  points: number,
  recurrence: TaskRecurrence,
  extras?: { description?: string; checklist?: TaskOccurrenceChecklistItem[] },
) {
  const days = new Set<WeekDay>(recurrence.daysOfWeek);
  const today = new Date();
  const batch = adminDb().batch();
  const occurrences = householdOccurrences(householdId);

  for (let i = 0; i < OCCURRENCE_HORIZON_DAYS; i++) {
    const date = addDays(today, i);
    if (!days.has(getDay(date) as WeekDay)) continue;

    const dateStr = format(date, "yyyy-MM-dd");
    const ref = occurrences.doc(`${taskId}_${dateStr}`);
    const existing = await ref.get();
    if (existing.exists) continue;

    batch.set(ref, buildOccurrence(taskId, title, assignedTo, points, dateStr, extras));
  }

  await batch.commit();
}

/** Genera las ocurrencias faltantes de los próximos 14 días para todas las
 * tareas recurrentes activas del hogar. Se llama al entrar al módulo de
 * tareas; es idempotente. */
export async function ensureUpcomingOccurrences(idToken: string) {
  const requester = await requireAppUser(idToken);

  const recurringTasks = await householdTasks(requester.householdId)
    .where("type", "==", "recurring")
    .where("active", "==", true)
    .get();

  for (const doc of recurringTasks.docs) {
    const task = doc.data();
    const checklistItems = (task.checklistItems ?? []) as TaskChecklistItem[];
    await generateOccurrencesForTask(
      requester.householdId,
      doc.id,
      task.title,
      task.assignedTo,
      task.points,
      task.recurrence,
      {
        description: task.description?.trim() || undefined,
        checklist: checklistItems.length > 0 ? snapshotChecklist(checklistItems) : undefined,
      },
    );
  }
}

function allChecklistItemsChecked(checklist?: TaskOccurrenceChecklistItem[]) {
  if (!checklist || checklist.length === 0) return true;
  return checklist.every((item) => item.checked);
}

export async function toggleChecklistItem(input: {
  idToken: string;
  occurrenceId: string;
  itemId: string;
  checked: boolean;
}) {
  const requester = await requireAppUser(input.idToken);
  const ref = householdOccurrences(requester.householdId).doc(input.occurrenceId);

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new AuthError("La tarea ya no existe.");
    const data = snap.data() as TaskOccurrence;

    if (data.assignedTo !== requester.id && requester.role !== "admin") {
      throw new AuthError("Solo la persona asignada puede marcar los pasos.");
    }
    if (data.status !== "pending" && data.status !== "overdue") {
      throw new AuthError("Esta tarea ya no admite cambios en el checklist.");
    }
    if (!data.checklist?.length) {
      throw new AuthError("Esta tarea no tiene checklist.");
    }

    const checklist = data.checklist.map((item) =>
      item.id === input.itemId ? { ...item, checked: input.checked } : item,
    );

    if (!checklist.some((item) => item.id === input.itemId)) {
      throw new AuthError("El paso del checklist ya no existe.");
    }

    tx.update(ref, { checklist });
  });
}

export async function completeOccurrence(input: { idToken: string; occurrenceId: string }) {
  const requester = await requireAppUser(input.idToken);
  const ref = householdOccurrences(requester.householdId).doc(input.occurrenceId);

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new AuthError("La tarea ya no existe.");
    const data = snap.data() as TaskOccurrence;

    if (data.assignedTo !== requester.id && requester.role !== "admin") {
      throw new AuthError("Solo la persona asignada puede marcar esta tarea.");
    }
    if (data.status !== "pending" && data.status !== "overdue") {
      throw new AuthError("Esta tarea ya fue marcada.");
    }
    if (!allChecklistItemsChecked(data.checklist)) {
      throw new AuthError("Completa todos los pasos del checklist antes de marcar la tarea.");
    }

    tx.update(ref, {
      status: "completed",
      completedBy: requester.id,
      completedAt: FieldValue.serverTimestamp(),
      reviewComment: FieldValue.delete(),
    });
  });
}

export async function verifyOccurrence(input: {
  idToken: string;
  occurrenceId: string;
  comment?: string;
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);
  const ref = householdOccurrences(requester.householdId).doc(input.occurrenceId);
  const userRef = adminDb().collection("users");

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new AuthError("La tarea ya no existe.");
    const data = snap.data() as TaskOccurrence;

    if (data.status !== "completed") {
      throw new AuthError("La tarea aún no fue marcada como completada.");
    }
    if (data.completedBy === requester.id) {
      throw new AuthError("Otra persona debe verificar esta tarea.");
    }

    const authorRef = userRef.doc(data.completedBy!);
    tx.update(ref, {
      status: "verified",
      reviewedBy: requester.id,
      reviewedAt: FieldValue.serverTimestamp(),
      pointsAwarded: data.points,
      ...(input.comment ? { reviewComment: input.comment } : {}),
    });
    tx.update(authorRef, { points: FieldValue.increment(data.points) });
  });
}

export async function rejectOccurrence(input: {
  idToken: string;
  occurrenceId: string;
  comment: string;
  penalty?: number;
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);
  const ref = householdOccurrences(requester.householdId).doc(input.occurrenceId);
  const userRef = adminDb().collection("users");
  const penalty = Math.max(0, input.penalty ?? 0);

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new AuthError("La tarea ya no existe.");
    const data = snap.data() as TaskOccurrence;

    if (data.status !== "completed") {
      throw new AuthError("La tarea aún no fue marcada como completada.");
    }
    if (data.completedBy === requester.id) {
      throw new AuthError("Otra persona debe revisar esta tarea.");
    }

    const resetChecklist = data.checklist?.map((item) => ({ ...item, checked: false }));

    tx.update(ref, {
      status: "pending",
      reviewedBy: requester.id,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewComment: input.comment,
      completedBy: FieldValue.delete(),
      completedAt: FieldValue.delete(),
      ...(resetChecklist?.length ? { checklist: resetChecklist } : {}),
    });

    if (penalty > 0 && data.completedBy) {
      tx.update(userRef.doc(data.completedBy), { points: FieldValue.increment(-penalty) });
    }
  });
}

export async function deleteOccurrence(input: {
  idToken: string;
  occurrenceId: string;
  mode: "occurrence" | "series";
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const occurrenceRef = householdOccurrences(requester.householdId).doc(input.occurrenceId);
  const userRef = adminDb().collection("users");
  const todayStr = format(new Date(), "yyyy-MM-dd");

  let taskId: string | null = null;
  let shouldDeactivate = false;
  let shouldCleanFuture = false;

  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(occurrenceRef);
    if (!snap.exists) throw new AuthError("La tarea ya no existe.");
    const data = snap.data() as TaskOccurrence;

    if (data.status === "completed") {
      throw new AuthError("Verifica o devuelve la tarea antes de eliminarla.");
    }

    const taskRef = householdTasks(requester.householdId).doc(data.taskId);
    const taskSnap = await tx.get(taskRef);

    if (taskSnap.exists) {
      const task = taskSnap.data() as Omit<Task, "id">;
      if (requester.role !== "admin" && task.createdBy !== requester.id) {
        throw new AuthError("No tienes permiso para eliminar esta tarea.");
      }
      taskId = data.taskId;
      shouldDeactivate = input.mode === "series" || task.type === "once";
      shouldCleanFuture = input.mode === "series" && task.type === "recurring";
    } else if (requester.role !== "admin") {
      throw new AuthError("No tienes permiso para eliminar esta tarea.");
    } else {
      taskId = data.taskId;
    }

    if (
      data.status === "verified" &&
      data.pointsAwarded &&
      data.pointsAwarded > 0 &&
      data.completedBy
    ) {
      tx.update(userRef.doc(data.completedBy), {
        points: FieldValue.increment(-data.pointsAwarded),
      });
    }

    tx.delete(occurrenceRef);

    if (shouldDeactivate && taskId) {
      tx.update(householdTasks(requester.householdId).doc(taskId), { active: false });
    }
  });

  if (shouldCleanFuture && taskId) {
    const futureSnap = await householdOccurrences(requester.householdId)
      .where("taskId", "==", taskId)
      .where("date", ">=", todayStr)
      .get();

    const batch = adminDb().batch();
    for (const doc of futureSnap.docs) {
      const occ = doc.data() as TaskOccurrence;
      if (
        (occ.status === "pending" || occ.status === "overdue") &&
        doc.id !== input.occurrenceId
      ) {
        batch.delete(doc.ref);
      }
    }
    await batch.commit();
  }
}
