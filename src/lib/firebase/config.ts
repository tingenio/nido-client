import { z } from "zod";

const clientEnvSchema = z.object({
  apiKey: z.string().min(1, "NEXT_PUBLIC_FIREBASE_API_KEY es requerido"),
  authDomain: z.string().min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN es requerido"),
  projectId: z.string().min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID es requerido"),
  storageBucket: z.string().min(1, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET es requerido"),
  messagingSenderId: z.string().min(1, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID es requerido"),
  appId: z.string().min(1, "NEXT_PUBLIC_FIREBASE_APP_ID es requerido"),
});

export type FirebaseClientConfig = z.infer<typeof clientEnvSchema>;

let cachedConfig: FirebaseClientConfig | null = null;

/**
 * Valida y devuelve la configuración pública de Firebase.
 * Falla rápido y con un mensaje claro si falta alguna variable en `.env.local`.
 */
export function getFirebaseClientConfig(): FirebaseClientConfig {
  if (cachedConfig) return cachedConfig;

  const parsed = clientEnvSchema.safeParse({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(
      `Configuración de Firebase incompleta. Revisa tu .env.local:\n${issues}`,
    );
  }

  cachedConfig = parsed.data;
  return cachedConfig;
}
