"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAdmin, requireAppUser } from "@/lib/auth/server";
import type { AppUser, UserRole } from "@/types";

/**
 * Se llama una única vez justo después del registro (sign-up) en Firebase
 * Auth. Si el email tiene una invitación pendiente, el usuario se une a ese
 * hogar con el rol invitado; si no, se convierte en el admin fundador de un
 * hogar nuevo. Es idempotente: si el perfil ya existe, simplemente lo
 * devuelve.
 */
export async function provisionUser(input: {
  idToken: string;
  name: string;
}): Promise<{ householdId: string; role: UserRole }> {
  const db = adminDb();
  const decoded = await adminAuth().verifyIdToken(input.idToken).catch(() => {
    throw new AuthError("Sesión inválida. Vuelve a iniciar sesión.");
  });
  const { uid, email } = decoded;
  if (!email) throw new AuthError("Tu cuenta no tiene un email asociado.");

  const userRef = db.collection("users").doc(uid);
  const existing = await userRef.get();
  if (existing.exists) {
    const data = existing.data() as Omit<AppUser, "id">;
    return { householdId: data.householdId, role: data.role };
  }

  const invitationQuery = await db
    .collectionGroup("invitations")
    .where("email", "==", email.toLowerCase())
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (!invitationQuery.empty) {
    const invitationDoc = invitationQuery.docs[0];
    const householdId = invitationDoc.ref.parent.parent?.id;
    if (!householdId) throw new Error("Invitación inválida.");
    const role = invitationDoc.data().role as UserRole;

    const newUser: Omit<AppUser, "id"> = {
      householdId,
      name: input.name,
      email,
      role,
      points: 0,
      createdAt: FieldValue.serverTimestamp() as unknown as AppUser["createdAt"],
    };

    await db.batch()
      .set(userRef, newUser)
      .update(invitationDoc.ref, { status: "accepted" })
      .commit();

    return { householdId, role };
  }

  // Sin invitación: funda un hogar nuevo como admin.
  const householdRef = db.collection("households").doc();
  const newUser: Omit<AppUser, "id"> = {
    householdId: householdRef.id,
    name: input.name,
    email,
    role: "admin",
    points: 0,
    createdAt: FieldValue.serverTimestamp() as unknown as AppUser["createdAt"],
  };

  await db.batch()
    .set(householdRef, {
      name: `Hogar de ${input.name}`,
      ownerId: uid,
      createdAt: FieldValue.serverTimestamp(),
    })
    .set(userRef, newUser)
    .commit();

  return { householdId: newUser.householdId, role: newUser.role };
}

function isValidAvatarUrl(photoURL: string, uid: string, storageBucket: string): boolean {
  try {
    const url = new URL(photoURL);
    const expectedHost = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/`;
    if (!url.href.startsWith(expectedHost)) return false;
    const encodedPath = url.pathname.split("/o/")[1]?.split("?")[0];
    if (!encodedPath) return false;
    const path = decodeURIComponent(encodedPath);
    return path.startsWith(`users/${uid}/avatar/`);
  } catch {
    return false;
  }
}

export async function updateProfile(input: {
  idToken: string;
  name: string;
  photoURL?: string | null;
}) {
  const user = await requireAppUser(input.idToken);
  const name = input.name.trim();
  if (name.length < 2) {
    throw new Error("El nombre debe tener al menos 2 caracteres.");
  }

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (input.photoURL && storageBucket) {
    if (!isValidAvatarUrl(input.photoURL, user.id, storageBucket)) {
      throw new Error("URL de foto inválida.");
    }
  }

  const updates: { name: string; photoURL?: string | null } = { name };
  if (input.photoURL !== undefined) {
    updates.photoURL = input.photoURL;
  }

  await adminDb().collection("users").doc(user.id).update(updates);

  const authUpdates: { displayName: string; photoURL?: string } = { displayName: name };
  if (input.photoURL) {
    authUpdates.photoURL = input.photoURL;
  }
  await adminAuth().updateUser(user.id, authUpdates);
}

export async function inviteMember(input: {
  idToken: string;
  email: string;
  role: UserRole;
}) {
  const requester = await requireAppUser(input.idToken);
  requireAdmin(requester);

  const email = input.email.trim().toLowerCase();
  await adminDb()
    .collection("households")
    .doc(requester.householdId)
    .collection("invitations")
    .add({
      email,
      role: input.role,
      invitedBy: requester.id,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });
}
