import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { AppUser } from "@/types";

export async function getHouseholdMemberEmails(householdId: string): Promise<string[]> {
  const snap = await adminDb().collection("users").where("householdId", "==", householdId).get();
  return snap.docs.map((doc) => (doc.data() as AppUser).email).filter(Boolean);
}

export async function getHouseholdAdminEmails(householdId: string): Promise<string[]> {
  const snap = await adminDb()
    .collection("users")
    .where("householdId", "==", householdId)
    .where("role", "==", "admin")
    .get();
  return snap.docs.map((doc) => (doc.data() as AppUser).email).filter(Boolean);
}

export async function getUserEmail(userId: string): Promise<string | undefined> {
  const snap = await adminDb().collection("users").doc(userId).get();
  if (!snap.exists) return undefined;
  return (snap.data() as AppUser).email;
}
