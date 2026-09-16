"use client";

import { auth } from "@/lib/firebase/client";

/** Token de sesión actual, requerido por toda Server Action protegida. */
export async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");
  return user.getIdToken();
}
