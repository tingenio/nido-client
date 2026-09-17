import type { Timestamp } from "firebase/firestore";

export type NoteCategory = "wifi" | "streaming" | "cuentas" | "otros";

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  wifi: "Wifi",
  streaming: "Streaming",
  cuentas: "Cuentas",
  otros: "Otros",
};

/** Documento en `households/{householdId}/notes/{noteId}` */
export interface Note {
  id: string;
  title: string;
  /** HTML generado por el editor enriquecido, sanitizado en el servidor. */
  contentHtml: string;
  category: NoteCategory;
  pinned: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
