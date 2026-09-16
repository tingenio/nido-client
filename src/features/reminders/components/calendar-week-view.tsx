"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { ReminderCalendarItem } from "@/features/reminders/components/reminder-calendar-item";
import {
  getRemindersForDay,
  getWeekDays,
  isToday,
  toDayKey,
} from "@/features/reminders/utils/calendar";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";

type CalendarWeekViewProps = {
  anchorDate: Date;
  reminders: Reminder[];
};

export function CalendarWeekView({ anchorDate, reminders }: CalendarWeekViewProps) {
  const weekDays = getWeekDays(anchorDate);

  return (
    <div className="space-y-4">
      {weekDays.map((day) => {
        const dayReminders = getRemindersForDay(reminders, day);
        const today = isToday(day);

        return (
          <section key={toDayKey(day)} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  "text-sm font-semibold capitalize",
                  today && "text-primary",
                )}
              >
                {format(day, "EEE d MMM", { locale: es })}
              </h3>
              {dayReminders.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {dayReminders.length}
                </Badge>
              )}
            </div>
            {dayReminders.length === 0 ? (
              <p className="text-muted-foreground py-2 text-xs">Sin recordatorios</p>
            ) : (
              <div className="space-y-2">
                {dayReminders.map((reminder) => (
                  <ReminderCalendarItem key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
