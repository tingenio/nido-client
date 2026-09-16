"use client";

import { format } from "date-fns";

import {
  getMonthGrid,
  getRemindersForDay,
  isCurrentMonth,
  isSameDay,
  isToday,
  toDayKey,
  WEEKDAY_LABELS,
} from "@/features/reminders/utils/calendar";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";

type CalendarMonthViewProps = {
  anchorDate: Date;
  selectedDay: Date;
  reminders: Reminder[];
  onSelectDay: (day: Date) => void;
};

export function CalendarMonthView({
  anchorDate,
  selectedDay,
  reminders,
  onSelectDay,
}: CalendarMonthViewProps) {
  const days = getMonthGrid(anchorDate);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-muted-foreground py-1 text-center text-[10px] font-semibold uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayReminders = getRemindersForDay(reminders, day);
          const pending = dayReminders.filter((r) => !r.doneAt);
          const done = dayReminders.filter((r) => r.doneAt);
          const inMonth = isCurrentMonth(day, anchorDate);
          const selected = isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <button
              key={toDayKey(day)}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "flex min-h-11 flex-col items-center justify-start rounded-lg px-1 py-1.5 transition-all duration-200",
                inMonth ? "text-foreground" : "text-muted-foreground/40",
                selected && "bg-primary/10",
                today && "ring-primary ring-2 ring-inset",
              )}
            >
              <span className={cn("text-sm font-medium", today && "text-primary")}>
                {format(day, "d")}
              </span>
              {dayReminders.length > 0 && (
                <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                  {pending.slice(0, 3).map((r) => (
                    <span
                      key={r.id}
                      className="bg-primary size-1.5 rounded-full"
                      aria-hidden="true"
                    />
                  ))}
                  {done.slice(0, Math.max(0, 3 - pending.length)).map((r) => (
                    <span
                      key={r.id}
                      className="bg-muted-foreground/50 size-1.5 rounded-full"
                      aria-hidden="true"
                    />
                  ))}
                  {dayReminders.length > 3 && (
                    <span className="text-muted-foreground text-[9px] leading-none">
                      +{dayReminders.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
