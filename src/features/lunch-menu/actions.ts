"use server";

import { FieldValue } from "firebase-admin/firestore";

import { AuthError, requireAppUser, requireNotExternal } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { WEEKDAYS, type Weekday } from "@/types";

export async function setLunchDay(input: {
  idToken: string;
  weekday: Weekday;
  meal: string;
  assignedTo?: string;
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  if (!WEEKDAYS.includes(input.weekday)) {
    throw new AuthError("Día inválido.");
  }

  const dayRef = adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("lunchMenu")
    .doc(input.weekday);

  const meal = input.meal.trim();
  if (!meal) {
    await dayRef.delete();
    return;
  }

  const assignedTo = input.assignedTo?.trim();

  await dayRef.set({
    meal,
    ...(assignedTo ? { assignedTo } : {}),
    updatedBy: requester.id,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
