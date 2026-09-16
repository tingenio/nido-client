import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { AppUser } from "@/types";

export class AuthError extends Error {}

/**
 * Verifica el ID token de Firebase enviado por el cliente y devuelve el
 * perfil de la app (rol, hogar, puntos). Toda Server Action que modifique
 * datos sensibles (tareas, puntos, fondos) debe pasar por aquí en vez de
 * confiar en el uid recibido del cliente.
 */
export async function requireAppUser(idToken: string): Promise<AppUser> {
  if (!idToken) throw new AuthError("Sesión no encontrada. Vuelve a iniciar sesión.");

  const decoded = await adminAuth().verifyIdToken(idToken).catch(() => {
    throw new AuthError("Sesión inválida o expirada. Vuelve a iniciar sesión.");
  });

  const snapshot = await adminDb().collection("users").doc(decoded.uid).get();
  if (!snapshot.exists) {
    throw new AuthError("No se encontró tu perfil de usuario.");
  }

  return { id: snapshot.id, ...(snapshot.data() as Omit<AppUser, "id">) };
}

export function requireNotExternal(user: AppUser) {
  if (user.role === "external") {
    throw new AuthError("Tu usuario no tiene permiso para esta acción.");
  }
}

export function requireAdmin(user: AppUser) {
  if (user.role !== "admin") {
    throw new AuthError("Solo un administrador puede realizar esta acción.");
  }
}
