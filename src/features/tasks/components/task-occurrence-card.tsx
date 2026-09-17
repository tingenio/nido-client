"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { UserLabel } from "@/components/ui/user-avatar";
import { TaskOccurrenceDetailDialog } from "@/features/tasks/components/task-occurrence-detail-dialog";
import { assigneeEarnsPoints } from "@/features/tasks/lib/assignee-earns-points";
import { taskStatusTheme } from "@/features/tasks/lib/task-status-theme";
import { cn } from "@/lib/utils";
import type { AppUser, TaskOccurrence } from "@/types";

export function TaskOccurrenceCard({
  occurrence,
  membersById,
  hideDate = false,
}: {
  occurrence: TaskOccurrence;
  membersById: Record<string, AppUser>;
  hideDate?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  const assignee = membersById[occurrence.assignedTo];
  const checklist = occurrence.checklist ?? [];
  const checkedCount = checklist.filter((item) => item.checked).length;
  const theme = taskStatusTheme[occurrence.status];
  const showPoints = assigneeEarnsPoints(assignee);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        className={cn(
          "task-card cursor-pointer ring-1 ring-foreground/5",
          theme.washClass,
        )}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
      >
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn("task-status-dot size-1.5 shrink-0 rounded-full", theme.dotClass)}
                  data-pulse={theme.pulse ? "true" : undefined}
                  aria-hidden
                />
                <p className="truncate font-medium leading-tight">{occurrence.title}</p>
              </div>
              <p className={cn("pl-3.5 text-xs", theme.textClass)}>{theme.label}</p>
            </div>
            {showPoints && (
              <span className="bg-muted/60 text-muted-foreground shrink-0 rounded-md px-2 py-0.5 text-xs tabular-nums">
                {occurrence.points} pts
              </span>
            )}
          </div>

          <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            {assignee ? (
              <UserLabel name={assignee.name} photoURL={assignee.photoURL} size="sm" />
            ) : (
              <span>—</span>
            )}
            {!hideDate && <span>· {occurrence.date}</span>}
          </p>

          {checklist.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Checklist</span>
                <span className="text-muted-foreground tabular-nums">
                  {checkedCount}/{checklist.length}
                </span>
              </div>
              <div className="flex gap-0.5">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300 ease-out",
                      item.checked ? "bg-[var(--brand-sage)]" : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {occurrence.reviewComment && (
            <p className="border-border text-muted-foreground flex items-start gap-2 border-l-2 py-0.5 pl-3 text-xs">
              <MessageSquare className="mt-0.5 size-3.5 shrink-0 opacity-60" />
              <span className="line-clamp-2">{occurrence.reviewComment}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <TaskOccurrenceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        occurrence={occurrence}
        membersById={membersById}
      />
    </>
  );
}
