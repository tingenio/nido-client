import type { Timestamp } from "firebase/firestore";

/** Documento en `households/{householdId}/reminders/{reminderId}` */
export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueAt: Timestamp;
  /** Minutos de anticipación para la notificación push. */
  notifyBeforeMinutes: number;
  createdBy: string;
  notifiedAt?: Timestamp;
  doneAt?: Timestamp;
  createdAt: Timestamp;
}
