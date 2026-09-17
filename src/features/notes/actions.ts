"use server";

import { FieldValue } from "firebase-admin/firestore";

import { sanitizeNoteHtml } from "@/features/notes/lib/sanitize-html";
import { AuthError, requireAppUser, requireNotExternal } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import type { NoteCategory } from "@/types";

const MAX_CONTENT_LENGTH = 20_000;

function validateInput(title: string, contentHtml: string) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new AuthError("El título es obligatorio.");
  if (contentHtml.length > MAX_CONTENT_LENGTH) {
    throw new AuthError("La nota es demasiado larga.");
  }
  return trimmedTitle;
}

export async function createNote(input: {
  idToken: string;
  title: string;
  contentHtml: string;
  category: NoteCategory;
  pinned: boolean;
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const title = validateInput(input.title, input.contentHtml);
  const contentHtml = sanitizeNoteHtml(input.contentHtml);

  await adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("notes")
    .add({
      title,
      contentHtml,
      category: input.category,
      pinned: input.pinned,
      createdBy: requester.id,
      updatedBy: requester.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function updateNote(input: {
  idToken: string;
  noteId: string;
  title: string;
  contentHtml: string;
  category: NoteCategory;
  pinned: boolean;
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const title = validateInput(input.title, input.contentHtml);
  const contentHtml = sanitizeNoteHtml(input.contentHtml);

  const noteRef = adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("notes")
    .doc(input.noteId);

  const noteDoc = await noteRef.get();
  if (!noteDoc.exists) throw new AuthError("Nota no encontrada.");

  await noteRef.update({
    title,
    contentHtml,
    category: input.category,
    pinned: input.pinned,
    updatedBy: requester.id,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function toggleNotePinned(input: { idToken: string; noteId: string; pinned: boolean }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const noteRef = adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("notes")
    .doc(input.noteId);

  const noteDoc = await noteRef.get();
  if (!noteDoc.exists) throw new AuthError("Nota no encontrada.");

  await noteRef.update({
    pinned: input.pinned,
    updatedBy: requester.id,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteNote(input: { idToken: string; noteId: string }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const noteRef = adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("notes")
    .doc(input.noteId);

  const noteDoc = await noteRef.get();
  if (!noteDoc.exists) throw new AuthError("Nota no encontrada.");

  await noteRef.delete();
}
