import type { Timestamp } from "firebase/firestore";

export type TaskType = "once" | "recurring";
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo

export interface TaskChecklistItem {
  id: string;
  label: string;
}

export interface TaskOccurrenceChecklistItem extends TaskChecklistItem {
  checked: boolean;
}

export interface TaskRecurrence {
  /** Días de la semana en que se genera una ocurrencia. */
  daysOfWeek: WeekDay[];
  /** Hora sugerida (HH:mm) en que debería completarse, opcional. */
  timeOfDay?: string;
}

/** Documento en `households/{householdId}/tasks/{taskId}` (definición/plantilla) */
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  createdBy: string;
  points: number;
  type: TaskType;
  /** Solo para type === "once" */
  dueDate?: Timestamp;
  /** Solo para type === "recurring" */
  recurrence?: TaskRecurrence;
  /** Pasos opcionales del checklist interno. */
  checklistItems?: TaskChecklistItem[];
  active: boolean;
  createdAt: Timestamp;
}

export type TaskOccurrenceStatus =
  | "pending"
  | "completed"
  | "verified"
  | "rejected"
  | "overdue";

/**
 * Documento en `households/{householdId}/taskOccurrences/{occurrenceId}`.
 * Cada tarea (única o recurrente) genera una ocurrencia por fecha; así el
 * checklist diario y el historial de puntos se calculan sobre el mismo modelo.
 */
export interface TaskOccurrence {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  assignedTo: string;
  points: number;
  /** Snapshot del checklist para esta ocurrencia; cada fecha reinicia los checks. */
  checklist?: TaskOccurrenceChecklistItem[];
  /** Fecha (sin hora) a la que corresponde esta ocurrencia, en formato yyyy-MM-dd. */
  date: string;
  status: TaskOccurrenceStatus;
  completedAt?: Timestamp;
  completedBy?: string;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewComment?: string;
  pointsAwarded?: number;
  createdAt: Timestamp;
}
