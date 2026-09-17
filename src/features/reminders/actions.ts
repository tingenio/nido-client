"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAppUser } from "@/lib/auth/server";
import { sendEmail } from "@/lib/email/send";
import { reminderCreatedTemplate } from "@/lib/email/templates";
import { getHouseholdMemberEmails } from "@/lib/email/recipients";

function parseDueAtISO(value: string): Date {
  if (!value) throw new AuthError("La fecha es obligatoria.");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AuthError("La fecha no es válida.");
  return date;
}

export async function createReminder(input: {
  idToken: string;
  title: string;
  description?: string;
  dueAt: string; // ISO UTC string
  notifyBeforeMinutes: number;
}) {
  const requester = await requireAppUser(input.idToken);

  const title = input.title.trim();
  if (!title) throw new AuthError("El título es obligatorio.");

  const description = input.description?.trim() || undefined;
  const dueAt = parseDueAtISO(input.dueAt);

  await adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("reminders")
    .add({
      title,
      ...(description ? { description } : {}),
      dueAt,
      notifyBeforeMinutes: input.notifyBeforeMinutes,
      createdBy: requester.id,
      doneAt: null,
      notifiedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });

  const memberEmails = await getHouseholdMemberEmails(requester.householdId);
  if (memberEmails.length > 0) {
    const { subject, html } = reminderCreatedTemplate({
      title,
      description,
      createdByName: requester.name,
      dueAt,
    });
    await sendEmail({ to: memberEmails, subject, html });
  }
}

export async function updateReminder(input: {
  idToken: string;
  reminderId: string;
  title: string;
  description?: string;
  dueAt: string; // ISO UTC string
  notifyBeforeMinutes: number;
}) {
  const requester = await requireAppUser(input.idToken);

  const title = input.title.trim();
  if (!title) throw new AuthError("El título es obligatorio.");

  const description = input.description?.trim() || undefined;
  const dueAt = parseDueAtISO(input.dueAt);

  const reminderRef = adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("reminders")
    .doc(input.reminderId);

  const reminderDoc = await reminderRef.get();
  if (!reminderDoc.exists) throw new AuthError("Recordatorio no encontrado.");

  const reminder = reminderDoc.data()!;
  if (reminder.createdBy !== requester.id && requester.role !== "admin") {
    throw new AuthError("No tienes permiso para editar este recordatorio.");
  }

  const previousDueAt = reminder.dueAt?.toDate?.()?.getTime?.();
  const dueAtChanged = previousDueAt !== dueAt.getTime();

  await reminderRef.update({
    title,
    description: description ?? FieldValue.delete(),
    dueAt,
    notifyBeforeMinutes: input.notifyBeforeMinutes,
    ...(dueAtChanged ? { notifiedAt: null } : {}),
  });
}
