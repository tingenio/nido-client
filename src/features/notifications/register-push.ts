"use client";

import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getToken, getMessaging, isSupported } from "firebase/messaging";

import { getFirebaseClientConfig } from "@/lib/firebase/config";
import { db, firebaseApp } from "@/lib/firebase/client";

/**
 * Pide permiso de notificaciones al navegador, registra el service worker
 * de FCM y guarda el token del dispositivo en el perfil del usuario para
 * que el cron de recordatorios (`/api/cron/notify-reminders`) pueda
 * enviarle push.
 */
export async function registerPush(uid: string): Promise<"granted" | "denied" | "unsupported"> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  if (!(await isSupported())) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const config = getFirebaseClientConfig();
  const params = new URLSearchParams(config as unknown as Record<string, string>);
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`,
  );

  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await updateDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) });
  }

  return "granted";
}
