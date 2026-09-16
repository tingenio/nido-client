import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "member" | "external";

/** Documento en `households/{householdId}` */
export interface Household {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
}

/** Documento en `users/{uid}` (uid = Firebase Auth UID) */
export interface AppUser {
  id: string;
  householdId: string;
  name: string;
  email: string;
  /** URL de Storage o data URL (base64) guardada en Firestore. */
  photoURL?: string;
  role: UserRole;
  points: number;
  createdAt: Timestamp;
}

/** Documento en `households/{householdId}/invitations/{invitationId}` */
export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: Timestamp;
}
