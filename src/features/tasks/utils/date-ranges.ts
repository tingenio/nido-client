import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";

import type { TaskOccurrence } from "@/types";

export type TaskView = "day" | "week" | "month";

const OVERDUE_LOOKBACK_DAYS = 14;

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getTodayKey(): string {
  return toDateKey(new Date());
}

export function getQueryBounds(view: TaskView, anchorDate: Date): { from: string; to: string } {
  const today = new Date();

  if (view === "day") {
    return {
      from: toDateKey(subDays(today, OVERDUE_LOOKBACK_DAYS)),
      to: getTodayKey(),
    };
  }

  if (view === "week") {
    const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
    return {
      from: toDateKey(weekStart),
      to: toDateKey(weekEnd),
    };
  }

  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  return {
    from: toDateKey(monthStart),
    to: toDateKey(monthEnd),
  };
}

export function formatPeriodLabel(date: Date, view: TaskView): string {
  if (view === "week") {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${format(weekStart, "d")}–${format(weekEnd, "d MMM yyyy", { locale: es })}`;
    }
    return `${format(weekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
  }

  return format(date, "MMMM yyyy", { locale: es });
}

export function navigatePeriod(date: Date, view: TaskView, direction: 1 | -1): Date {
  if (view === "week") {
    return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
  }
  return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
}

export function formatSectionDate(dateKey: string): string {
  const date = parseISO(dateKey);
  if (isToday(date)) return "Hoy";
  return format(date, "EEEE d MMM", { locale: es });
}

function isOverdueOccurrence(occurrence: TaskOccurrence, todayKey: string): boolean {
  return (
    occurrence.date < todayKey &&
    (occurrence.status === "pending" ||
      occurrence.status === "overdue" ||
      occurrence.status === "completed")
  );
}

export function getDayViewSections(
  occurrences: TaskOccurrence[],
  todayKey = getTodayKey(),
): { overdue: TaskOccurrence[]; today: TaskOccurrence[] } {
  const overdue = occurrences.filter((o) => isOverdueOccurrence(o, todayKey));
  const today = occurrences.filter((o) => o.date === todayKey);
  return { overdue, today };
}

export function getPeriodViewSections(
  occurrences: TaskOccurrence[],
  view: TaskView,
  anchorDate: Date,
): { title: string; items: TaskOccurrence[] }[] {
  const bounds = getQueryBounds(view, anchorDate);
  const filtered = occurrences.filter((o) => o.date >= bounds.from && o.date <= bounds.to);

  if (view === "week") {
    const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days
      .map((day) => {
        const dateKey = toDateKey(day);
        const items = filtered.filter((o) => o.date === dateKey);
        return {
          title: formatSectionDate(dateKey),
          items,
        };
      })
      .filter((section) => section.items.length > 0);
  }

  const byDate = new Map<string, TaskOccurrence[]>();
  for (const occurrence of filtered) {
    const list = byDate.get(occurrence.date) ?? [];
    list.push(occurrence);
    byDate.set(occurrence.date, list);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, items]) => ({
      title: formatSectionDate(dateKey),
      items,
    }));
}

export function countOverdue(occurrences: TaskOccurrence[], todayKey = getTodayKey()): number {
  return occurrences.filter((o) => isOverdueOccurrence(o, todayKey)).length;
}

export function getEmptyMessage(view: TaskView): string {
  if (view === "day") return "Nada para hoy. ¡Buen descanso!";
  return "Sin tareas en este periodo.";
}
