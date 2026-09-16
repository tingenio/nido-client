import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";

import type { Reminder } from "@/types";

export type CalendarView = "day" | "week" | "month";

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function toDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function groupRemindersByDay(reminders: Reminder[]): Map<string, Reminder[]> {
  const map = new Map<string, Reminder[]>();
  for (const reminder of reminders) {
    const key = toDayKey(reminder.dueAt.toDate());
    const list = map.get(key) ?? [];
    list.push(reminder);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.dueAt.toDate().getTime() - b.dueAt.toDate().getTime());
  }
  return map;
}

export function getMonthGrid(anchorDate: Date): Date[] {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getWeekDays(anchorDate: Date): Date[] {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatPeriodLabel(date: Date, view: CalendarView): string {
  if (view === "day") {
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  }
  if (view === "week") {
    const days = getWeekDays(date);
    const start = days[0]!;
    const end = days[6]!;
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "d")}–${format(end, "d MMM yyyy", { locale: es })}`;
    }
    return `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`;
  }
  return format(date, "MMMM yyyy", { locale: es });
}

export function navigatePeriod(date: Date, view: CalendarView, direction: 1 | -1): Date {
  if (view === "day") return direction === 1 ? addDays(date, 1) : subDays(date, 1);
  if (view === "week") return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
  return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
}

export function getRemindersForDay(reminders: Reminder[], day: Date): Reminder[] {
  return reminders.filter((r) => isSameDay(r.dueAt.toDate(), day));
}

export function isCurrentMonth(day: Date, anchorDate: Date): boolean {
  return isSameMonth(day, anchorDate);
}

export { isToday, isSameDay, startOfDay };
