import { NextResponse } from "next/server";

import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import type { AppUser, Reminder } from "@/types";

export const dynamic = "force-dynamic";

const MAX_WINDOW_MS = 24 * 60 * 60 * 1000; // recordatorios de hasta 24h a futuro

/**
 * Llamado una vez al día (Vercel Cron, ver vercel.json — el plan gratuito
 * de Vercel no permite crons más frecuentes) para enviar la notificación
 * push de los recordatorios que vencen en las próximas 24h. Protegido con
 * CRON_SECRET para que no sea invocable públicamente.
 *
 * Al correr una sola vez al día, `notifyBeforeMinutes` ya no se usa para
 * calcular el momento exacto del aviso (rara vez coincidiría con la hora
 * del cron) — en su lugar, cualquier recordatorio pendiente que venza
 * dentro de la ventana de 24h se notifica en la corrida diaria.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const now = Date.now();
  const horizon = new Date(now + MAX_WINDOW_MS);

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

    await reminderDoc.ref.update({ notifiedAt: new Date() });
    notified++;
  }

  return NextResponse.json({ checked: dueSoon.size, notified });
}
