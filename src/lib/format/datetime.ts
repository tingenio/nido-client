export const APP_TIMEZONE = "America/Bogota";
export const APP_TIMEZONE_OFFSET = "-05:00";

function formatToParts(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    ...options,
  }).formatToParts(date);
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "00";
}

/** Convierte valor de datetime-local (hora Bogotá) a ISO UTC. */
export function datetimeLocalToISO(value: string): string {
  const date = new Date(`${value}:00${APP_TIMEZONE_OFFSET}`);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida");
  return date.toISOString();
}

/** Convierte Date (instante UTC) a valor para input datetime-local en hora Bogotá. */
export function dateToDatetimeLocal(date: Date): string {
  const parts = formatToParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}T${getPart(parts, "hour")}:${getPart(parts, "minute")}`;
}

/** Clave de día yyyy-MM-dd en hora Bogotá. */
export function toAppDayKey(date: Date): string {
  const parts = formatToParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}`;
}

/** Hora y minuto en Bogotá. */
export function getAppHoursAndMinutes(date: Date): { hour: number; minute: number } {
  const parts = formatToParts(date, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return {
    hour: Number(getPart(parts, "hour")),
    minute: Number(getPart(parts, "minute")),
  };
}

export function isSameAppDay(a: Date, b: Date): boolean {
  return toAppDayKey(a) === toAppDayKey(b);
}

export function formatAppDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: APP_TIMEZONE,
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export function formatAppDateTimeMedium(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: APP_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAppTime(date: Date): string {
  const { hour, minute } = getAppHoursAndMinutes(date);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Formatea un valor datetime-local para preview legible en hora Bogotá. */
export function formatDatetimeLocalPreview(value: string): string | null {
  if (!value) return null;

  try {
    const date = new Date(`${value}:00${APP_TIMEZONE_OFFSET}`);
    if (Number.isNaN(date.getTime())) return null;
    return formatAppDateTime(date);
  } catch {
    return null;
  }
}

/** Valor mínimo para input datetime-local (ahora en Bogotá). */
export function minDatetimeLocalValue(): string {
  return dateToDatetimeLocal(new Date());
}
