"use client";

import { Clock } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ReminderDetailDialog } from "@/features/reminders/components/reminder-detail-dialog";
import { useReminderActions } from "@/features/reminders/hooks/use-reminder-actions";
import { formatAppDateTimeMedium } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";

export function ReminderCard({ reminder }: { reminder: Reminder }) {
  const { appUser, toggleDone } = useReminderActions(reminder);
  const [detailOpen, setDetailOpen] = useState(false);

  if (!appUser) return null;

  const dueDate = reminder.dueAt.toDate();
  const isDone = Boolean(reminder.doneAt);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
      >
        <CardContent className="flex items-center gap-3">
          <Checkbox
            checked={isDone}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(checked) => toggleDone(Boolean(checked))}
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-medium leading-tight transition-all duration-200",
                isDone && "text-muted-foreground line-through opacity-70",
              )}
            >
              {reminder.title}
            </p>
            {reminder.description && (
              <p
                className={cn(
                  "text-muted-foreground text-xs transition-opacity duration-200",
                  isDone && "opacity-60",
                )}
              >
                {reminder.description}
              </p>
            )}
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <Clock className="size-3 shrink-0" />
              {formatAppDateTimeMedium(dueDate)} · aviso{" "}
              {reminder.notifyBeforeMinutes} min antes
            </p>
          </div>
        </CardContent>
      </Card>

      <ReminderDetailDialog open={detailOpen} onOpenChange={setDetailOpen} reminder={reminder} />
    </>
  );
}
