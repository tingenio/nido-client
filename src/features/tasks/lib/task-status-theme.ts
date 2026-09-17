import type { TaskOccurrence } from "@/types";

export type TaskStatusTheme = {
  label: string;
  dotClass: string;
  washClass: string;
  textClass: string;
  pulse: boolean;
};

export const taskStatusTheme: Record<TaskOccurrence["status"], TaskStatusTheme> = {
  pending: {
    label: "Pendiente",
    dotClass: "bg-muted-foreground/40",
    washClass: "",
    textClass: "text-muted-foreground",
    pulse: false,
  },
  overdue: {
    label: "Vencida",
    dotClass: "bg-destructive",
    washClass: "bg-destructive/[0.04] dark:bg-destructive/[0.08]",
    textClass: "text-destructive/80",
    pulse: true,
  },
  completed: {
    label: "Por verificar",
    dotClass: "bg-[var(--brand-sage)]",
    washClass: "bg-[var(--brand-sage)]/[0.06] dark:bg-[var(--brand-sage)]/[0.1]",
    textClass: "text-[var(--brand-sage)] dark:text-secondary-foreground",
    pulse: true,
  },
  verified: {
    label: "Verificada",
    dotClass: "bg-primary",
    washClass: "bg-primary/[0.04] dark:bg-primary/[0.08]",
    textClass: "text-primary/80",
    pulse: false,
  },
  rejected: {
    label: "Rechazada",
    dotClass: "bg-destructive",
    washClass: "bg-destructive/[0.04] dark:bg-destructive/[0.08]",
    textClass: "text-destructive/80",
    pulse: false,
  },
};
