import "server-only";

import { SESv2Client } from "@aws-sdk/client-sesv2";

/**
 * Cliente de AWS SES. Inicialización perezosa (mismo patrón que
 * src/lib/firebase/admin.ts) para que `next build` no falle recolectando
 * datos de rutas cuando las credenciales aún no están en `.env.local`.
 */
let cachedClient: SESv2Client | null = null;

export function getSesClient(): SESv2Client {
  if (cachedClient) return cachedClient;

  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Faltan credenciales de AWS SES. Define AWS_REGION, AWS_ACCESS_KEY_ID y " +
        "AWS_SECRET_ACCESS_KEY en tu .env.local.",
    );
  }

  cachedClient = new SESv2Client({ region, credentials: { accessKeyId, secretAccessKey } });
  return cachedClient;
}

export function getSesFromAddress(): string {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) {
    throw new Error("Falta SES_FROM_EMAIL en tu .env.local (remitente verificado en SES).");
  }
  return from;
}
