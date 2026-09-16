import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";

import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { sendEmail } from "@/lib/email/send";
import { billPaymentDueTemplate, reminderDueTemplate } from "@/lib/email/templates";
import { getHouseholdAdminEmails } from "@/lib/email/recipients";
import type { AppUser, BillPayment, Reminder } from "@/types";

export const dynamic = "force-dynamic";

const MAX_WINDOW_MS = 24 * 60 * 60 * 1000; // recordatorios de hasta 24h a futuro

/**
 * Llamado una vez al día (Vercel Cron, ver vercel.json — el plan gratuito
 * de Vercel limita el número de cron jobs, así que este único cron agrupa
 * todas las notificaciones diarias: recordatorios y pagos vencidos).
 * Protegido con CRON_SECRET para que no sea invocable públicamente.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const reminders = await notifyDueReminders(db);
  const billPayments = await notifyOverdueBillPayments(db);

  return NextResponse.json({ reminders, billPayments });
}

/**
 * Al correr una sola vez al día, `notifyBeforeMinutes` ya no se usa para
 * calcular el momento exacto del aviso (rara vez coincidiría con la hora
 * del cron) — en su lugar, cualquier recordatorio pendiente que venza
 * dentro de la ventana de 24h se notifica en la corrida diaria.
 */
async function notifyDueReminders(db: Firestore) {
  const horizon = new Date(Date.now() + MAX_WINDOW_MS);

  const dueSoon = await db
    .collectionGroup("reminders")
    .where("doneAt", "==", null)
    .where("notifiedAt", "==", null)
    .where("dueAt", "<=", horizon)
    .get();

  let notified = 0;

  for (const reminderDoc of dueSoon.docs) {
    const reminder = reminderDoc.data() as Reminder;

    const householdId = reminderDoc.ref.parent.parent?.id;
    if (!householdId) continue;

    const members = await db
      .collection("users")
      .where("householdId", "==", householdId)
      .get();

    const tokens = members.docs.flatMap((m) => (m.data() as AppUser & { fcmTokens?: string[] }).fcmTokens ?? []);
    if (tokens.length > 0) {
      await adminMessaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `⏰ ${reminder.title}`,
          body: reminder.description || "Recordatorio del hogar",
        },
        data: { url: "/reminders" },
      });
    }

    const emails = members.docs.map((m) => (m.data() as AppUser).email).filter(Boolean);
    if (emails.length > 0) {
      const { subject, html } = reminderDueTemplate({
        title: reminder.title,
        description: reminder.description,
        dueAt: reminder.dueAt.toDate(),
      });
      await sendEmail({ to: emails, subject, html });
    }

    await reminderDoc.ref.update({ notifiedAt: new Date() });
    notified++;
  }

  return { checked: dueSoon.size, notified };
}

/**
 * Avisa a los admins de cada hogar sobre pagos (`billPayments`) que ya
 * llegaron a su día de vencimiento del mes y siguen en estado "pending" —
 * se repite cada día mientras el pago no se marque como pagado.
 *
 * Solo puede notificar los `billPayments` que ya existen como documento:
 * hoy esos documentos se generan on-demand (`ensureBillPaymentsForMonth`)
 * cuando alguien abre la vista de facturas del mes, no por un cron mensual.
 * Si nadie abrió esa vista este mes, no hay nada que consultar.
 */
async function notifyOverdueBillPayments(db: Firestore) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const dayOfMonth = today.getDate();

  const pending = await db
    .collectionGroup("billPayments")
    .where("month", "==", currentMonth)
    .where("status", "==", "pending")
    .get();

  let notified = 0;
  const adminEmailsByHousehold = new Map<string, string[]>();

  for (const paymentDoc of pending.docs) {
    const payment = paymentDoc.data() as BillPayment;
    if ((payment.dueDay ?? 99) > dayOfMonth) continue;

    const householdId = paymentDoc.ref.parent.parent?.id;
    if (!householdId) continue;

    let adminEmails = adminEmailsByHousehold.get(householdId);
    if (!adminEmails) {
      adminEmails = await getHouseholdAdminEmails(householdId);
      adminEmailsByHousehold.set(householdId, adminEmails);
    }
    if (adminEmails.length === 0) continue;

    const { subject, html } = billPaymentDueTemplate({
      name: payment.name,
      amount: payment.amount,
      month: payment.month,
      dueDay: payment.dueDay,
    });
    await sendEmail({ to: adminEmails, subject, html });
    notified++;
  }

  return { checked: pending.size, notified };
}
