"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAppUser } from "@/lib/auth/server";
import { sendEmail } from "@/lib/email/send";
import { reminderCreatedTemplate } from "@/lib/email/templates";
import { getHouseholdMemberEmails } from "@/lib/email/recipients";

export async function createReminder(input: {
  idToken: string;
  title: string;
  description?: string;
  dueAt: string; // datetime-local value
  notifyBeforeMinutes: number;
}) {
  const requester = await requireAppUser(input.idToken);

  const title = input.title.trim();
  if (!title) throw new AuthError("El título es obligatorio.");
  if (!input.dueAt) throw new AuthError("La fecha es obligatoria.");

  const description = input.description?.trim() || undefined;

  await adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("reminders")
    .add({
      title,
      ...(description ? { description } : {}),
      dueAt: new Date(input.dueAt),
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
      dueAt: new Date(input.dueAt),
    });
    await sendEmail({ to: memberEmails, subject, html });
  }
}
