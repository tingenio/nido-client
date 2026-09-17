import type { Timestamp } from "firebase/firestore";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

/** Documento en `households/{householdId}/lunchMenu/{weekday}`, id = Weekday */
export interface LunchMenuEntry {
  id: Weekday;
  /** Texto libre, ej. "Arroz con pollo y ensalada". */
  meal: string;
  /** Opcional: quién cocina ese día (texto libre, no referencia a un usuario). */
  assignedTo?: string;
  updatedBy: string;
  updatedAt: Timestamp;
}
