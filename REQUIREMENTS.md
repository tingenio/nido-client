# Nido — Gestión Familiar del Hogar

Documento de requerimientos. Sirve como referencia para abordar el desarrollo módulo por módulo. Se irá actualizando a medida que se defina o cambie el alcance.

## 1. Stack tecnológico

- **Framework**: Next.js (App Router) — frontend + backend (API routes / server actions) en un solo proyecto.
- **Backend/datos**: Firebase
  - Firestore como base de datos (realtime donde aplique: checklist de tareas, notificaciones).
  - Firebase Auth para usuarios.
  - Firebase Cloud Messaging (FCM) para notificaciones push de recordatorios.
  - Cloud Functions (o cron jobs) para generar instancias de tareas recurrentes y disparar notificaciones.
- **PWA**: instalable, mobile-first, con manifest + service worker (offline básico, iconos, splash screen).
- **Hosting**: Vercel o Firebase Hosting (a decidir).

## 2. Roles y usuarios

- **Tipos de usuario**:
  - **Admin/Padre-Madre**: gestiona miembros, asigna tareas a cualquiera, gestiona gastos y fondos, ve todos los reportes.
  - **Miembro de familia**: ve/marca sus tareas, puede asignar tareas a otros, ve recordatorios, participa del sistema de puntos.
  - **Externo (ej. empleada doméstica)**: acceso restringido — solo módulo de tareas (las que se le asignen), sin acceso a gastos, fondos ni recordatorios personales.
- Cada usuario tiene: nombre, foto (opcional), rol, puntos acumulados.
- Autenticación vía Firebase Auth (email/password o invitación por link).

### Preguntas abiertas
- ¿Quién puede crear/invitar nuevos usuarios? (asumo: solo Admin)
- ¿Un "externo" puede tener más de una casa asignada, o solo pertenece a una familia/hogar?

## 3. Módulo de Tareas

- Cualquier integrante (no externo) puede crear una tarea y asignarla a otro miembro (incluyendo externos).
- Tipos de tarea:
  - **Única**: fecha/hora específica.
  - **Recurrente**: patrón de repetición (días específicos de la semana, todos los días, cada N días, etc.).
- Cada tarea tiene: título, descripción, asignado a, creado por, puntos que otorga, fecha límite/horario, estado.
- Flujo de estados: `pendiente` → `completada` (marcada por el asignado) → `verificada` (revisada por otro miembro) o `rechazada` (devuelta con comentario).
- Al rechazar una tarea:
  - Vuelve a estado `pendiente` (o `rechazada` visible hasta que se re-haga).
  - Se puede restar puntos como penalización.
  - Se registra un comentario del revisor.
- Sistema de puntos:
  - Se otorgan al completar y ser verificada una tarea.
  - Se pueden restar por rechazo.
  - Historial/ranking de puntos por miembro.

### Preguntas abiertas
- ¿Quién puede verificar una tarea? ¿Cualquiera menos quien la completó, o solo quien la creó/asignó?
- ¿Los puntos tienen algún fin (canjear premios) o son solo simbólicos/ranking?
- Para tareas recurrentes: si no se marca un día, ¿pasa a "vencida" y afecta puntos?

## 4. Módulo de Recordatorios

- Cualquier miembro puede crear un recordatorio (fecha/hora, título, descripción).
- Notificación push (FCM) antes de que se cumpla (configurable: X minutos/horas antes).
- Visible para toda la familia (o se puede definir a quién notifica).
- Distinto de las tareas: no tiene puntos, no requiere verificación, es solo un "aviso".

### Preguntas abiertas
- ¿Recordatorios son visibles/compartidos para todos siempre, o se pueden crear privados?
- ¿Se pueden marcar como "hecho" o solo desaparecen tras la fecha?

## 5. Módulo de Gastos y Fondos

- **Registro de gastos**:
  - Gastos recurrentes (ej. servicios, mensualidades) con frecuencia definida.
  - Gastos variables/puntuales que se registran manualmente durante el mes.
  - Cada gasto: monto, categoría, fecha, descripción, quién lo registró, a qué fondo/categoría pertenece (opcional).
- **Reporte mensual**: resumen de gastos totales, por categoría, comparación entre meses.
- **Fondos (sobres/budgets)**:
  - Ej: Ocio, Ahorro, Mercado, etc. — categorías con saldo propio.
  - Se les asigna dinero (ingreso de fondos).
  - Al registrar un gasto asociado a un fondo, se descuenta del saldo disponible.
  - Si el fondo llega a 0, no se puede seguir gastando de ahí hasta que se reponga (ingreso nuevo).
  - Historial de movimientos por fondo (ingresos y egresos).

### Preguntas abiertas
- ¿Los fondos se recargan manualmente o en una fecha fija (ej. cada quincena/mes)?
- ¿Se permite que un gasto quede "sin fondo asociado" (gasto general de la casa)?
- ¿Quién puede registrar gastos y mover fondos? ¿Todos o solo Admin?
- ¿Se requiere adjuntar comprobantes/fotos de recibos?

## 6. Consideraciones generales de PWA / UX

- Diseño mobile-first, instalable (Add to Home Screen).
- Notificaciones push para: tareas asignadas, tareas por vencer, recordatorios próximos a cumplirse, tareas rechazadas.
- Navegación simple tipo app: Tareas / Recordatorios / Gastos / Perfil-Puntos.

## 7. Roadmap sugerido (para abordar punto por punto)

1. **Base del proyecto**: Next.js + Firebase (Auth, Firestore) + configuración PWA mínima.
2. **Gestión de usuarios y roles** (familia, hogar, invitaciones).
3. **Módulo de Tareas** (creación, asignación, recurrencia, checklist, verificación, puntos).
4. **Módulo de Recordatorios** (CRUD + notificaciones push).
5. **Módulo de Gastos y Fondos** (registro, fondos, reportes mensuales).
6. **Notificaciones push end-to-end (FCM)** — transversal a tareas/recordatorios.
7. **Pulido PWA** (offline, iconos, splash, performance).
