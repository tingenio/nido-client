"use client";

import { ListChecks } from "lucide-react";
import { useEffect, useMemo } from "react";

import { CreateAction } from "@/components/layout/create-action";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { TaskOccurrenceCard } from "@/features/tasks/components/task-occurrence-card";
import { ensureUpcomingOccurrences } from "@/features/tasks/actions";
import { useTaskOccurrences } from "@/features/tasks/hooks/use-task-occurrences";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";

export default function TasksPage() {
  const { appUser } = useAuth();
  const { occurrences, loading } = useTaskOccurrences();
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = occurrences.filter((o) => o.date === todayStr);
  const upcoming = occurrences.filter((o) => o.date > todayStr);
  const past = occurrences.filter((o) => o.date < todayStr);

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

      {loading ? (
        <ListSkeleton />
      ) : occurrences.length === 0 ? (
        <EmptyState icon={ListChecks} message="No hay tareas por aquí todavía." />
      ) : (
        <>
          <Section title="Hoy" items={today} membersById={membersById} />
          <Section title="Próximas" items={upcoming} membersById={membersById} />
          <Section title="Atrasadas / por revisar" items={past} membersById={membersById} />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  membersById,
}: {
  title: string;
  items: ReturnType<typeof useTaskOccurrences>["occurrences"];
  membersById: Record<string, ReturnType<typeof useHouseholdMembers>["members"][number]>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <SectionHeader title={title} count={items.length} />
      <div className="space-y-2">
        {items.map((occurrence, index) => (
          <div key={occurrence.id} className="list-item-enter" style={{ "--index": index } as React.CSSProperties}>
            <TaskOccurrenceCard occurrence={occurrence} membersById={membersById} />
          </div>
        ))}
      </div>
    </div>
  );
}
