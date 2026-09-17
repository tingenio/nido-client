import "server-only";

import { formatEmailAmount, formatEmailDate, formatEmailMonth } from "./format";
import {
  emailDetailsTable,
  emailHighlightBox,
  emailParagraph,
  getAppUrl,
  renderEmailLayout,
} from "./layout";

type EmailTemplate = { subject: string; html: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appLink(path: string): string {
  return `${getAppUrl()}${path}`;
}

export function reminderDueTemplate(input: {
  title: string;
  description?: string;
  dueAt: Date;
}): EmailTemplate {
  const title = escapeHtml(input.title);
  const dueFormatted = formatEmailDate(input.dueAt);

  const body =
    emailParagraph(`El recordatorio <strong>${title}</strong> vence en menos de 24 horas.`) +
    emailDetailsTable([{ label: "Fecha límite", value: dueFormatted }]) +
    (input.description ? emailHighlightBox(escapeHtml(input.description), "amber") : "");

  return {
    subject: `[Nido] Recordatorio: "${input.title}" vence pronto`,
    html: renderEmailLayout({
      title: input.title,
      preheader: `Vence el ${dueFormatted}`,
      badge: "Vence pronto",
      accent: "amber",
      bodyHtml: body,
      cta: { label: "Ver recordatorios", href: appLink("/reminders") },
    }),
  };
}

export function reminderCreatedTemplate(input: {
  title: string;
  description?: string;
  createdByName: string;
  dueAt: Date;
}): EmailTemplate {
  const title = escapeHtml(input.title);
  const dueFormatted = formatEmailDate(input.dueAt);

  const body =
    emailParagraph(
      `<strong>${escapeHtml(input.createdByName)}</strong> creó un nuevo recordatorio en el hogar.`,
    ) +
    emailDetailsTable([
      { label: "Recordatorio", value: title },
      { label: "Fecha límite", value: dueFormatted },
      { label: "Creado por", value: escapeHtml(input.createdByName) },
    ]) +
    (input.description ? emailHighlightBox(escapeHtml(input.description)) : "");

  return {
    subject: `[Nido] ${input.createdByName} creó el recordatorio "${input.title}"`,
    html: renderEmailLayout({
      title: "Nuevo recordatorio",
      preheader: `Vence el ${dueFormatted}`,
      badge: "Nuevo recordatorio",
      accent: "primary",
      bodyHtml: body,
      cta: { label: "Ver recordatorios", href: appLink("/reminders") },
    }),
  };
}

export function taskCreatedTemplate(input: {
  taskTitle: string;
  description?: string;
  points: number;
  dueDate?: string;
  assignedByName?: string;
}): EmailTemplate {
  const title = escapeHtml(input.taskTitle);
  const rows = [
    { label: "Tarea", value: title },
    ...(input.points > 0 ? [{ label: "Puntos", value: `+${input.points} pts` }] : []),
    ...(input.dueDate ? [{ label: "Fecha límite", value: input.dueDate }] : []),
    ...(input.assignedByName ? [{ label: "Asignada por", value: escapeHtml(input.assignedByName) }] : []),
  ];

  const body =
    emailParagraph(`Se te asignó una nueva tarea en el hogar.`) +
    emailDetailsTable(rows) +
    (input.description ? emailHighlightBox(escapeHtml(input.description)) : "");

  return {
    subject:
      input.points > 0
        ? `[Nido] Nueva tarea: "${input.taskTitle}" (+${input.points} pts)`
        : `[Nido] Nueva tarea: "${input.taskTitle}"`,
    html: renderEmailLayout({
      title: input.taskTitle,
      preheader:
        input.points > 0
          ? `Gana ${input.points} puntos al completarla`
          : `Tienes una nueva tarea por completar`,
      badge: "Nueva tarea",
      accent: "primary",
      bodyHtml: body,
      cta: { label: "Ver tareas", href: appLink("/tasks") },
    }),
  };
}

export function taskPendingReviewTemplate(input: {
  taskTitle: string;
  completedByName: string;
  completedAt?: Date;
}): EmailTemplate {
  const title = escapeHtml(input.taskTitle);
  const rows = [
    { label: "Tarea", value: title },
    { label: "Completada por", value: escapeHtml(input.completedByName) },
    ...(input.completedAt ? [{ label: "Completada el", value: formatEmailDate(input.completedAt) }] : []),
  ];

  const body =
    emailParagraph(
      `<strong>${escapeHtml(input.completedByName)}</strong> marcó esta tarea como completada. Revisa y verifica el trabajo.`,
    ) + emailDetailsTable(rows);

  return {
    subject: `[Nido] Revisar tarea completada: "${input.taskTitle}"`,
    html: renderEmailLayout({
      title: "Tarea pendiente de verificación",
      preheader: `${input.completedByName} completó "${input.taskTitle}"`,
      badge: "Revisión pendiente",
      accent: "amber",
      bodyHtml: body,
      cta: { label: "Revisar tarea", href: appLink("/tasks") },
    }),
  };
}

export function taskVerifiedTemplate(input: {
  taskTitle: string;
  points: number;
  comment?: string;
  reviewedByName?: string;
}): EmailTemplate {
  const title = escapeHtml(input.taskTitle);
  const rows = [
    { label: "Tarea", value: title },
    ...(input.points > 0 ? [{ label: "Puntos ganados", value: `+${input.points} pts` }] : []),
    ...(input.reviewedByName ? [{ label: "Verificada por", value: escapeHtml(input.reviewedByName) }] : []),
  ];

  const body =
    emailParagraph(
      input.points > 0
        ? `¡Buen trabajo! Tu tarea fue verificada y sumaste puntos.`
        : `¡Buen trabajo! Tu tarea fue verificada.`,
    ) +
    emailDetailsTable(rows) +
    (input.comment ? emailHighlightBox(`Comentario: ${escapeHtml(input.comment)}`, "sage") : "");

  return {
    subject:
      input.points > 0
        ? `[Nido] ¡Aprobada! +${input.points} pts por "${input.taskTitle}"`
        : `[Nido] Tarea verificada: "${input.taskTitle}"`,
    html: renderEmailLayout({
      title: "Tarea verificada",
      preheader:
        input.points > 0
          ? `Ganaste ${input.points} puntos por "${input.taskTitle}"`
          : `Tu tarea "${input.taskTitle}" fue verificada`,
      badge: "Tarea aprobada",
      accent: "sage",
      bodyHtml: body,
      cta: { label: "Ver tareas", href: appLink("/tasks") },
    }),
  };
}

export function taskRejectedTemplate(input: {
  taskTitle: string;
  comment: string;
  reviewedByName?: string;
}): EmailTemplate {
  const title = escapeHtml(input.taskTitle);
  const rows = [
    { label: "Tarea", value: title },
    ...(input.reviewedByName ? [{ label: "Devuelta por", value: escapeHtml(input.reviewedByName) }] : []),
  ];

  const body =
    emailParagraph(`Tu tarea fue devuelta y necesita ajustes antes de volver a completarse.`) +
    emailDetailsTable(rows) +
    emailHighlightBox(`Comentario: ${escapeHtml(input.comment)}`, "red");

  return {
    subject: `[Nido] Tarea devuelta: "${input.taskTitle}" necesita ajustes`,
    html: renderEmailLayout({
      title: "Tarea devuelta",
      preheader: `"${input.taskTitle}" necesita correcciones`,
      badge: "Necesita ajustes",
      accent: "red",
      bodyHtml: body,
      cta: { label: "Ver tarea", href: appLink("/tasks") },
    }),
  };
}

export function billPaymentDueTemplate(input: {
  name: string;
  amount: number;
  month: string;
  dueDay?: number;
}): EmailTemplate {
  const name = escapeHtml(input.name);
  const amountFormatted = formatEmailAmount(input.amount);
  const monthFormatted = formatEmailMonth(input.month);

  const rows = [
    { label: "Pago", value: name },
    { label: "Monto", value: amountFormatted },
    { label: "Mes", value: monthFormatted },
    ...(input.dueDay ? [{ label: "Día de vencimiento", value: `Día ${input.dueDay}` }] : []),
  ];

  const body =
    emailParagraph(
      `El pago <strong>${name}</strong> llegó a su fecha de vencimiento y sigue sin registrarse como pagado.`,
    ) + emailDetailsTable(rows);

  return {
    subject: `[Nido] Pago vencido: ${input.name} — ${amountFormatted}`,
    html: renderEmailLayout({
      title: "Pago vencido sin registrar",
      preheader: `${input.name} (${amountFormatted}) — ${monthFormatted}`,
      badge: "Pago pendiente",
      accent: "amber",
      bodyHtml: body,
      cta: { label: "Ver facturas", href: appLink("/expenses") },
    }),
  };
}
