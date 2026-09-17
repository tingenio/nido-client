"use client";

import { format, isSameDay } from "date-fns";

import { ReminderCalendarItem } from "@/features/reminders/components/reminder-calendar-item";
import { getRemindersForDay } from "@/features/reminders/utils/calendar";
import { getAppHoursAndMinutes } from "@/lib/format/datetime";
import type { Reminder } from "@/types";

const HOUR_START = 6;
const HOUR_END = 22;

type CalendarDayViewProps = {
  anchorDate: Date;
  reminders: Reminder[];
};

export function CalendarDayView({ anchorDate, reminders }: CalendarDayViewProps) {
  const dayReminders = getRemindersForDay(reminders, anchorDate);
  const now = new Date();
  const isTodayView = isSameDay(anchorDate, now);
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const allDay: Reminder[] = [];
  const byHour = new Map<number, Reminder[]>();

  for (const reminder of dayReminders) {
    const due = reminder.dueAt.toDate();
    const { hour } = getAppHoursAndMinutes(due);
    if (hour < HOUR_START || hour >= HOUR_END) {
      allDay.push(reminder);
      continue;
    }
    const list = byHour.get(hour) ?? [];
    list.push(reminder);
    byHour.set(hour, list);
  }

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  return (
    <div className="space-y-4">
      {allDay.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Todo el día
          </h3>
          <div className="space-y-2">
            {allDay.map((reminder) => (
              <ReminderCalendarItem key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>
      )}

      <div className="relative space-y-0">
        {hours.map((hour) => {
          const slotReminders = byHour.get(hour) ?? [];
          const showNowLine = isTodayView && currentHour >= hour && currentHour < hour + 1;

          return (
            <div key={hour} className="relative flex min-h-14 gap-3 border-t border-border/60 pt-2">
              <span className="text-muted-foreground w-10 shrink-0 pt-0.5 text-xs tabular-nums">
                {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
              </span>
              <div className="relative min-w-0 flex-1 space-y-2 pb-2">
                {showNowLine && (
                  <div
                    className="pointer-events-none absolute right-0 left-0 z-10 flex items-center"
                    style={{ top: `${((currentHour - hour) * 100).toFixed(0)}%` }}
                  >
                    <span className="bg-primary size-2 shrink-0 rounded-full" />
                    <span className="bg-primary h-px flex-1" />
                  </div>
                )}
                {slotReminders.length === 0 ? (
                  <div className="h-6" />
                ) : (
                  slotReminders.map((reminder) => (
                    <ReminderCalendarItem key={reminder.id} reminder={reminder} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {dayReminders.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Sin recordatorios este día
        </p>
      )}
    </div>
  );
}
