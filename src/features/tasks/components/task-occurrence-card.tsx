"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TaskOccurrenceDetailDialog } from "@/features/tasks/components/task-occurrence-detail-dialog";
import { cn } from "@/lib/utils";
import type { AppUser, TaskOccurrence } from "@/types";

const statusLabel: Record<TaskOccurrence["status"], string> = {
  pending: "Pendiente",
  completed: "Por verificar",
  verified: "Verificada",
  rejected: "Rechazada",
  overdue: "Vencida",
};

const statusVariant: Record<
  TaskOccurrence["status"],
  "outline" | "success" | "default" | "destructive" | "warning"
> = {
  pending: "outline",
  completed: "success",
  verified: "default",
  rejected: "destructive",
  overdue: "destructive",
};

const statusBorder: Record<TaskOccurrence["status"], string> = {
  pending: "border-l-primary",
  completed: "border-l-[var(--brand-sage)]",
  verified: "border-l-primary/60",
  rejected: "border-l-destructive",
  overdue: "border-l-destructive",
};

export function TaskOccurrenceCard({
  occurrence,
  membersById,
}: {
  occurrence: TaskOccurrence;
  membersById: Record<string, AppUser>;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  const assignee = membersById[occurrence.assignedTo];
  const checklist = occurrence.checklist ?? [];
  const checkedCount = checklist.filter((item) => item.checked).length;

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        className={cn("border-l-4 cursor-pointer transition-shadow hover:shadow-md", statusBorder[occurrence.status])}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
      >
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium leading-tight">{occurrence.title}</p>
              <p className="text-muted-foreground text-xs">
                {assignee?.name ?? "—"} · {occurrence.date} · {occurrence.points} pts
              </p>
            </div>
            <Badge variant={statusVariant[occurrence.status]}>{statusLabel[occurrence.status]}</Badge>
          </div>

          {checklist.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Checklist</span>
                <span className="text-muted-foreground tabular-nums">
                  {checkedCount}/{checklist.length}
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-[var(--brand-sage)] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {occurrence.reviewComment && (
            <p className="bg-muted flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
              <MessageSquare className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
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
