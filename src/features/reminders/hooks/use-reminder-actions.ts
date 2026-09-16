"use client";

import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { Reminder } from "@/types";

export function useReminderActions(reminder: Reminder) {
  const { appUser } = useAuth();

  const canManage =
    appUser != null &&
    (reminder.createdBy === appUser.id || appUser.role === "admin");

  async function toggleDone(checked: boolean) {
    if (!appUser) return;
    try {
      await updateDoc(doc(db, "households", appUser.householdId, "reminders", reminder.id), {
        doneAt: checked ? serverTimestamp() : null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar");
    }
  }

  async function handleDelete() {
    if (!appUser) return;
    try {
      await deleteDoc(doc(db, "households", appUser.householdId, "reminders", reminder.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar");
    }
  }

  return { appUser, canManage, toggleDone, handleDelete };
}
