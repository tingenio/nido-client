"use client";

import { AlertCircle, ListChecks } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CreateAction } from "@/components/layout/create-action";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { TaskOccurrenceCard } from "@/features/tasks/components/task-occurrence-card";
import { TaskPeriodNav } from "@/features/tasks/components/task-period-nav";
import { TaskViewTabs } from "@/features/tasks/components/task-view-tabs";
import { ensureUpcomingOccurrences } from "@/features/tasks/actions";
import { useOverdueCount, useTaskOccurrences } from "@/features/tasks/hooks/use-task-occurrences";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import {
  getDayViewSections,
  getEmptyMessage,
  getPeriodViewSections,
  type TaskView,
} from "@/features/tasks/utils/date-ranges";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import type { AppUser, TaskOccurrence } from "@/types";

export default function TasksPage() {
  const { appUser } = useAuth();
  const [view, setView] = useState<TaskView>("day");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const { occurrences, loading } = useTaskOccurrences({ view, anchorDate });
  const overdueCount = useOverdueCount();
  const { members } = useHouseholdMembers();

  useEffect(() => {
    if (!appUser || appUser.role === "external") return;
    getIdToken()
      .then((idToken) => ensureUpcomingOccurrences(idToken))
      .catch(() => {});
  }, [appUser]);

  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  );

  const sections = useMemo((): { title: string; items: TaskOccurrence[]; variant?: "warning" }[] => {
    if (view === "day") {
      const { overdue, today } = getDayViewSections(occurrences);
      const result: { title: string; items: TaskOccurrence[]; variant?: "warning" }[] = [];
      if (overdue.length > 0) {
        result.push({ title: "Atrasadas", items: overdue, variant: "warning" });
      }
      if (today.length > 0) {
        result.push({ title: "Hoy", items: today });
      }
      return result;
    }
    return getPeriodViewSections(occurrences, view, anchorDate);
  }, [occurrences, view, anchorDate]);

  const totalVisible = sections.reduce((sum, section) => sum + section.items.length, 0);

  function handleToday() {
    setAnchorDate(new Date());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description="Organiza y da seguimiento a las tareas del hogar."
      />

      {appUser?.role !== "external" && (
        <CreateAction label="Nueva tarea">
          {({ open, onOpenChange }) => (
            <CreateTaskDialog open={open} onOpenChange={onOpenChange} />
          )}
        </CreateAction>
      )}

      <TaskViewTabs view={view} onViewChange={setView} overdueCount={overdueCount} />

      {(view === "week" || view === "month") && (
        <TaskPeriodNav
          anchorDate={anchorDate}
          view={view}
          onAnchorChange={setAnchorDate}
          onToday={handleToday}
        />
      )}

      {loading ? (
        <ListSkeleton />
      ) : totalVisible === 0 ? (
        <EmptyState icon={ListChecks} message={getEmptyMessage(view)} />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <TaskSection
              key={section.title}
              title={section.title}
              items={section.items}
              membersById={membersById}
              hideDate={view !== "day" || section.title === "Hoy"}
              variant={section.variant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskSection({
  title,
  items,
  membersById,
  hideDate,
  variant,
}: {
  title: string;
  items: TaskOccurrence[];
  membersById: Record<string, AppUser>;
  hideDate?: boolean;
  variant?: "warning";
}) {
  return (
    <div className="space-y-2">
      {variant === "warning" && (
        <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>Tienes {items.length} tarea{items.length === 1 ? "" : "s"} que requieren atención</span>
        </div>
      )}
      <SectionHeader title={title} count={items.length} />
      <div className="space-y-2">
        {items.map((occurrence, index) => (
          <div
            key={occurrence.id}
            className="list-item-enter"
            style={{ "--index": index } as React.CSSProperties}
          >
            <TaskOccurrenceCard
              occurrence={occurrence}
              membersById={membersById}
              hideDate={hideDate}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
