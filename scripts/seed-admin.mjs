/**
 * Bootstrap del primer administrador y hogar.
 *
 * Uso (desde la raíz del proyecto):
 *
 *   SEED_ADMIN_EMAIL=admin@ejemplo.com \
 *   SEED_ADMIN_PASSWORD=miPassword123 \
 *   SEED_ADMIN_NAME="Admin Principal" \
 *   SEED_HOUSEHOLD_NAME="Mi Hogar" \
 *   node scripts/seed-admin.mjs
 *
 * Requiere FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY
 * en .env.local (o exportadas en el entorno).
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME?.trim();
const householdName = process.env.SEED_HOUSEHOLD_NAME?.trim() || "Mi Hogar";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

function requireEnv(label, value) {
  if (!value) {
    console.error(`Falta ${label}.`);
    process.exit(1);
  }
}

requireEnv("SEED_ADMIN_EMAIL", email);
requireEnv("SEED_ADMIN_PASSWORD", password);
requireEnv("SEED_ADMIN_NAME", name);
requireEnv("FIREBASE_PROJECT_ID", projectId);
requireEnv("FIREBASE_CLIENT_EMAIL", clientEmail);
requireEnv("FIREBASE_PRIVATE_KEY", privateKey);

if (password.length < 6) {
  console.error("SEED_ADMIN_PASSWORD debe tener al menos 6 caracteres.");
  process.exit(1);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

const auth = getAuth(app);
const db = getFirestore(app);

const existing = await auth.getUserByEmail(email).catch((error) => {
  if (error.code === "auth/user-not-found") return null;
  throw error;
});

if (existing) {
  console.error(`Ya existe un usuario con el email ${email}.`);
  process.exit(1);
}

const authUser = await auth.createUser({
  email,
  password,
  displayName: name,
});

const householdRef = db.collection("households").doc();
const userRef = db.collection("users").doc(authUser.uid);

try {
  const batch = db.batch();
  batch.set(householdRef, {
    name: householdName,
    ownerId: authUser.uid,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(userRef, {
    householdId: householdRef.id,
    name,
    email,
    role: "admin",
    points: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
} catch (error) {
  await auth.deleteUser(authUser.uid).catch(() => undefined);
  throw error;
}

console.log("Administrador creado correctamente.");
console.log(`  Email:    ${email}`);
console.log(`  Hogar:    ${householdName} (${householdRef.id})`);
console.log(`  Usuario:  ${authUser.uid}`);
