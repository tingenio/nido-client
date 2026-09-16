"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useReminderActions } from "@/features/reminders/hooks/use-reminder-actions";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";

export function ReminderCalendarItem({ reminder }: { reminder: Reminder }) {
  const { appUser, canManage, toggleDone, handleDelete } = useReminderActions(reminder);
  if (!appUser) return null;

  const dueDate = reminder.dueAt.toDate();
  const isDone = Boolean(reminder.doneAt);

  return (
    <div className="bg-card flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 shadow-[var(--shadow-sm)] ring-1 ring-foreground/10">
      <Checkbox
        checked={isDone}
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
      {canManage && (
        <Button variant="ghost" size="icon-sm" onClick={handleDelete} aria-label="Eliminar">
          <Trash2 className="text-muted-foreground size-3.5" />
        </Button>
      )}
    </div>
  );
}
