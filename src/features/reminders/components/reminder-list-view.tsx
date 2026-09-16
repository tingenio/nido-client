"use client";

import { Bell } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { SectionHeader } from "@/components/layout/section-header";
import { ReminderCard } from "@/features/reminders/components/reminder-card";
import type { Reminder } from "@/types";

type ReminderListViewProps = {
  reminders: Reminder[];
  loading: boolean;
};

export function ReminderListView({ reminders, loading }: ReminderListViewProps) {
  const pending = reminders.filter((r) => !r.doneAt);
  const done = reminders.filter((r) => r.doneAt);

  if (loading) {
    return <ListSkeleton />;
  }

  if (reminders.length === 0) {
    return <EmptyState icon={Bell} message="No hay recordatorios pendientes." />;
  }

  return (
    <>
      <div className="space-y-2">
        <SectionHeader title="Pendientes" count={pending.length} />
        {pending.length === 0 ? (
          <EmptyState icon={Bell} message="No hay recordatorios pendientes." />
        ) : (
          <div className="space-y-2">
            {pending.map((r, index) => (
              <div
                key={r.id}
                className="list-item-enter"
                style={{ "--index": index } as React.CSSProperties}
              >
                <ReminderCard reminder={r} />
              </div>
            ))}
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div className="space-y-2">
          <SectionHeader title="Hechos" count={done.length} />
          <div className="space-y-2">
            {done.map((r, index) => (
              <div
                key={r.id}
                className="list-item-enter"
                style={{ "--index": index } as React.CSSProperties}
              >
                <ReminderCard reminder={r} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
