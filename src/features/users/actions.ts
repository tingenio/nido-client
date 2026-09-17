"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAdmin, requireAppUser } from "@/lib/auth/server";
import type { AppUser, UserRole } from "@/types";

/**
 * Provisión legacy para invitaciones pendientes creadas antes del registro
 * restringido. Idempotente: si el perfil ya existe, simplemente lo devuelve.
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

  throw new AuthError(
    "Tu cuenta no tiene acceso. Contacta al administrador de tu hogar.",
  );
}

const MAX_PHOTO_DATA_URL_LENGTH = 220_000;

function isValidPhotoDataUrl(photoURL: string): boolean {
  if (!photoURL.startsWith("data:image/")) return false;
  if (photoURL.length > MAX_PHOTO_DATA_URL_LENGTH) return false;
  return /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(photoURL);
}

function isAvatarObjectPath(path: string, uid: string): boolean {
  return path.startsWith(`users/${uid}/avatar/`);
}

function isValidStorageAvatarUrl(photoURL: string, uid: string, storageBucket: string): boolean {
  try {
    const url = new URL(photoURL);

    if (url.hostname === "firebasestorage.googleapis.com") {
      const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (!match) return false;
      const [, bucket, encodedPath] = match;
      if (bucket !== storageBucket) return false;
      const path = decodeURIComponent(encodedPath.split("?")[0]);
      return isAvatarObjectPath(path, uid);
    }

    if (url.hostname === "storage.googleapis.com") {
      const path = url.pathname.replace(/^\//, "");
      if (!path.startsWith(`${storageBucket}/`)) return false;
      const objectPath = path.slice(storageBucket.length + 1);
      return isAvatarObjectPath(objectPath, uid);
    }

    return false;
  } catch {
    return false;
  }
}

function isValidPhotoURL(photoURL: string, uid: string, storageBucket?: string): boolean {
  if (isValidPhotoDataUrl(photoURL)) return true;
  if (storageBucket && isValidStorageAvatarUrl(photoURL, uid, storageBucket)) return true;
  return false;
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
  if (input.photoURL) {
    if (!isValidPhotoURL(input.photoURL, user.id, storageBucket)) {
      throw new Error("Foto de perfil inválida.");
    }
  }

  const updates: { name: string; photoURL?: string | null } = { name };
  if (input.photoURL !== undefined) {
    updates.photoURL = input.photoURL;
  }

  await adminDb().collection("users").doc(user.id).update(updates);

  const authUpdates: { displayName: string; photoURL?: string } = { displayName: name };
  // Firebase Auth no acepta data URLs largas; la foto vive en Firestore.
  if (input.photoURL && !input.photoURL.startsWith("data:")) {
    authUpdates.photoURL = input.photoURL;
  }
  await adminAuth().updateUser(user.id, authUpdates);
}

const VALID_ROLES: UserRole[] = ["admin", "member", "external"];

export async function createMember(input: {
  idToken: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
}) {
  const requester = await requireAppUser(input.idToken);
  requireAdmin(requester);

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!email) throw new AuthError("Ingresa un email válido.");
  if (name.length < 2) throw new AuthError("El nombre debe tener al menos 2 caracteres.");
  if (password.length < 6) throw new AuthError("La contraseña debe tener al menos 6 caracteres.");
  if (!VALID_ROLES.includes(input.role)) throw new AuthError("Rol inválido.");

  const existingAuth = await adminAuth()
    .getUserByEmail(email)
    .catch((error: { code?: string }) => {
      if (error.code === "auth/user-not-found") return null;
      throw error;
    });
  if (existingAuth) {
    throw new AuthError("Ya existe una cuenta con ese email.");
  }

  const authUser = await adminAuth().createUser({
    email,
    password,
    displayName: name,
  });

  try {
    const newUser: Omit<AppUser, "id"> = {
      householdId: requester.householdId,
      name,
      email,
      role: input.role,
      points: 0,
      createdAt: FieldValue.serverTimestamp() as unknown as AppUser["createdAt"],
    };

    await adminDb().collection("users").doc(authUser.uid).set(newUser);
  } catch (error) {
    await adminAuth().deleteUser(authUser.uid).catch(() => undefined);
    throw error;
  }
}

export async function adminUpdateMember(input: {
  idToken: string;
  memberId: string;
  name?: string;
  role?: UserRole;
  photoURL?: string | null;
  password?: string;
}) {
  const requester = await requireAppUser(input.idToken);
  requireAdmin(requester);

  if (input.memberId === requester.id) {
    throw new AuthError("Usa Editar perfil para modificar tu propia cuenta.");
  }

  const memberRef = adminDb().collection("users").doc(input.memberId);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    throw new AuthError("Integrante no encontrado.");
  }

  const member = memberSnap.data() as Omit<AppUser, "id">;
  if (member.householdId !== requester.householdId) {
    throw new AuthError("No tienes permiso para editar este integrante.");
  }

  const firestoreUpdates: { name?: string; role?: UserRole; photoURL?: string | null } = {};
  const authUpdates: { displayName?: string; photoURL?: string; password?: string } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2) throw new AuthError("El nombre debe tener al menos 2 caracteres.");
    firestoreUpdates.name = name;
    authUpdates.displayName = name;
  }

  if (input.role !== undefined) {
    if (!VALID_ROLES.includes(input.role)) throw new AuthError("Rol inválido.");

    if (member.role === "admin" && input.role !== "admin") {
      const admins = await adminDb()
        .collection("users")
        .where("householdId", "==", requester.householdId)
        .where("role", "==", "admin")
        .get();
      if (admins.size <= 1) {
        throw new AuthError("Debe quedar al menos un administrador en el hogar.");
      }
    }

    firestoreUpdates.role = input.role;
  }

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (input.photoURL !== undefined) {
    if (input.photoURL && !isValidPhotoURL(input.photoURL, input.memberId, storageBucket)) {
      throw new AuthError("Foto de perfil inválida.");
    }
    firestoreUpdates.photoURL = input.photoURL;
    if (input.photoURL && !input.photoURL.startsWith("data:")) {
      authUpdates.photoURL = input.photoURL;
    }
  }

  if (input.password !== undefined) {
    if (input.password.length > 0 && input.password.length < 6) {
      throw new AuthError("La contraseña debe tener al menos 6 caracteres.");
    }
    if (input.password.length >= 6) {
      authUpdates.password = input.password;
    }
  }

  if (
    firestoreUpdates.name === undefined &&
    firestoreUpdates.role === undefined &&
    firestoreUpdates.photoURL === undefined &&
    authUpdates.password === undefined
  ) {
    throw new AuthError("No hay cambios para guardar.");
  }

  if (Object.keys(firestoreUpdates).length > 0) {
    await memberRef.update(firestoreUpdates);
  }

  if (Object.keys(authUpdates).length > 0) {
    await adminAuth().updateUser(input.memberId, authUpdates);
  }
}
