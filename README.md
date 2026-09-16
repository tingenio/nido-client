# Nido — Gestión del hogar

App PWA (Next.js + Firebase) para gestionar tareas con puntos, recordatorios y
gastos/fondos de la familia. Ver [REQUIREMENTS.md](./REQUIREMENTS.md) para el
detalle funcional.

## Stack

- **Next.js 16** (App Router, Server Actions) — usado también como backend.
- **Firebase**: Auth (email/password), Firestore (datos + realtime), Cloud
  Messaging (push), Admin SDK (Server Actions con transacciones).
- **Tailwind CSS 4 + shadcn/ui** (preset `base-ui`, no Radix) para la UI.
- **Serwist** para el service worker de la PWA.
- **Vercel Cron** para el envío periódico de notificaciones de recordatorios.

## Arquitectura

```
src/
  app/
    (auth)/login/              rutas públicas (login/registro)
    (app)/                     rutas protegidas (AuthGuard + bottom nav)
      tasks/ reminders/ expenses/ profile/
    api/cron/notify-reminders/ endpoint llamado por Vercel Cron
    manifest.ts, sw.ts         PWA
  features/
    tasks/ reminders/ expenses/ users/ notifications/
      actions.ts    Server Actions (mutaciones con Admin SDK + transacciones)
      hooks/         lectura realtime con el SDK cliente (onSnapshot)
      components/
  lib/
    firebase/        client.ts (SDK cliente), admin.ts (SDK admin, lazy init)
    auth/             AuthProvider, AuthGuard, verificación de ID token
  types/              modelos de dominio compartidos
```

**Patrón usado en todo el proyecto**: las lecturas van directo por el SDK
cliente de Firestore (realtime, gratis en cuanto a servidor) protegidas por
`firestore.rules`. Las escrituras que tienen efectos secundarios importantes
(otorgar/restar puntos, mover saldo de un fondo, aceptar una invitación) pasan
por **Server Actions** que verifican el ID token con el Admin SDK y corren en
una transacción — así ningún cliente puede, por ejemplo, escribirse puntos a
sí mismo directamente en Firestore.

## Puesta en marcha

1. Instala dependencias:
   ```bash
   pnpm install
   ```
2. Copia `.env.example` a `.env.local` y completa:
   - Los valores `NEXT_PUBLIC_FIREBASE_*` (Firebase Console > Configuración
     del proyecto > General > tus apps > SDK config).
   - `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (Cloud Messaging > Web Push
     certificates > Generate key pair).
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
     (Configuración del proyecto > Cuentas de servicio > Generar nueva clave
     privada — del JSON descargado).
   - `CRON_SECRET`: cualquier string aleatorio (usado para proteger el
     endpoint de notificaciones).
3. En Firebase Console, habilita:
   - **Authentication** > Sign-in method > Email/Password.
   - **Firestore Database** (modo nativo).
   - **Cloud Messaging** (para push).
4. Despliega las reglas e índices de Firestore:
   ```bash
   firebase deploy --only firestore --project <tu-project-id>
   ```
5. Corre en desarrollo:
   ```bash
   pnpm dev
   ```

El primer usuario que se registra (sin invitación pendiente) se convierte en
**admin** y funda el hogar. Desde su perfil puede invitar a otros integrantes
por email (rol miembro o externo); cuando esa persona se registra con ese
mismo email, se une automáticamente al hogar con el rol asignado.

## Notificaciones push

El endpoint `/api/cron/notify-reminders` revisa los recordatorios que vencen
en las próximas 24h (aún no notificados) y envía push a los dispositivos
registrados. En producción se dispara vía **Vercel Cron** (ver
`vercel.json`, una vez al día a las 12:00 UTC) — si despliegas en otro lado,
necesitas programar tú esa llamada (con el header
`Authorization: Bearer <CRON_SECRET>`).

El plan gratuito (Hobby) de Vercel solo permite crons con frecuencia diaria,
por eso corre una vez al día en vez de cada pocos minutos. Como consecuencia,
`notifyBeforeMinutes` ya no determina el momento exacto del aviso — el push
llega en algún momento de esa corrida diaria, no X minutos antes del evento.
Si pasas a un plan de pago (o despliegas fuera de Vercel) puedes bajar la
frecuencia en `vercel.json` y restaurar el chequeo por minuto en
`src/app/api/cron/notify-reminders/route.ts`.

Las tareas y tareas recurrentes generan sus "ocurrencias" (instancias por
fecha) de forma perezosa: al entrar al módulo de Tareas se llama a
`ensureUpcomingOccurrences`, que crea las que falten para los próximos 14
días. Es idempotente. No requiere Cloud Functions.

## Decisiones tomadas sobre las preguntas abiertas de REQUIREMENTS.md

Para poder avanzar con la implementación se tomaron estos defaults (ajustables
después):

- Solo el admin invita integrantes; el primer usuario registrado sin
  invitación funda el hogar como admin.
- Cualquier integrante (no externo, distinto de quien completó la tarea)
  puede verificar/rechazar una tarea.
- Los puntos son un ranking simbólico (ver Perfil), sin canje implementado.
- Las tareas recurrentes generan ocurrencias por los próximos 14 días; no hay
  penalización automática por no marcarlas (se puede agregar luego).
- Los recordatorios son visibles para todo el hogar (no hay privados) y
  cualquier integrante los puede marcar como hechos.
- Los fondos se recargan manualmente por un admin; un gasto puede quedar
  "sin fondo" (gasto general de la casa).
- No hay adjuntar comprobantes/fotos todavía.

## Pendientes / roadmap

- [ ] Reemplazar los íconos placeholder de `public/icons/` e imagen de perfil
      por assets reales.
- [ ] Historial completo de revisiones de tareas (hoy solo se guarda el
      último comentario/penalización, no un log).
- [ ] Adjuntar comprobantes a gastos.
- [ ] Tests automatizados (unitarios de las Server Actions, e2e del flujo de
      tareas).
