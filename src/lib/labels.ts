import type { ExpenseFrequency, UserRole } from "@/types";

/** Etiquetas cortas para badges y listas. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  member: "Miembro",
  external: "Externo",
};

/** Etiquetas descriptivas para formularios e invitaciones. */
export const ROLE_FORM_LABELS: Record<Exclude<UserRole, "admin">, string> = {
  member: "Miembro de la familia",
  external: "Externo (ej. empleada doméstica)",
};

export const EXPENSE_FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  yearly: "Anual",
};

export function resolveLabel<T extends string>(
  map: Record<T, string>,
  value: T,
  fallback?: string,
): string {
  return map[value] ?? fallback ?? value;
}
