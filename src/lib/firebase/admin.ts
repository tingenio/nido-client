import "server-only";

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

/**
 * SDK de administrador de Firebase. Solo debe importarse desde código de
 * servidor (Route Handlers, Server Actions) — nunca desde componentes
 * cliente. `server-only` lanza un error de build si se importa
 * accidentalmente en un bundle de cliente.
 *
 * La inicialización es perezosa (solo ocurre al llamar a las funciones, no
 * al importar el módulo) para que `next build` no falle recolectando datos
 * de rutas cuando las credenciales aún no están configuradas en `.env.local`.
 */
let cachedApp: App | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Faltan credenciales de Firebase Admin. Define FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en tu .env.local " +
        "(descarga la clave de servicio desde Firebase Console > Configuración " +
        "del proyecto > Cuentas de servicio).",
    );
  }

  cachedApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return cachedApp;
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminMessaging = () => getMessaging(getAdminApp());
