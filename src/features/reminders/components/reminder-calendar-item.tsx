"use client";

import { format } from "date-fns";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { ReminderDetailDialog } from "@/features/reminders/components/reminder-detail-dialog";
import { useReminderActions } from "@/features/reminders/hooks/use-reminder-actions";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";

export function ReminderCalendarItem({ reminder }: { reminder: Reminder }) {
  const { appUser, toggleDone } = useReminderActions(reminder);
  const [detailOpen, setDetailOpen] = useState(false);

  if (!appUser) return null;

  const dueDate = reminder.dueAt.toDate();
  const isDone = Boolean(reminder.doneAt);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="bg-card flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 shadow-[var(--shadow-sm)] ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
      >
        <Checkbox
          checked={isDone}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(checked) => toggleDone(Boolean(checked))}
        />
        <span className="text-muted-foreground w-11 shrink-0 text-xs tabular-nums">
          {format(dueDate, "HH:mm")}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium transition-all duration-200",
            isDone && "text-muted-foreground line-through opacity-70",
          )}
        >
          {reminder.title}
        </span>
      </div>

      <ReminderDetailDialog open={detailOpen} onOpenChange={setDetailOpen} reminder={reminder} />
    </>
  );
}
