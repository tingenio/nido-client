"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TaskView } from "@/features/tasks/utils/date-ranges";

type TaskViewTabsProps = {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  overdueCount?: number;
};

const labels: Record<TaskView, string> = {
  day: "Hoy",
  week: "Semana",
  month: "Mes",
};

export function TaskViewTabs({ view, onViewChange, overdueCount = 0 }: TaskViewTabsProps) {
  return (
    <Tabs
      value={view}
      onValueChange={(value) => onViewChange(value as TaskView)}
      className="space-y-4"
    >
      <TabsList className="h-11 w-full p-1">
        {(Object.keys(labels) as TaskView[]).map((key) => (
          <TabsTrigger key={key} className="h-full flex-1 rounded-lg" value={key}>
            {labels[key]}
            {key === "day" && overdueCount > 0 ? ` (${overdueCount})` : ""}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
