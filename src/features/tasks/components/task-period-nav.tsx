"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatPeriodLabel,
  navigatePeriod,
  type TaskView,
} from "@/features/tasks/utils/date-ranges";

type TaskPeriodNavProps = {
  anchorDate: Date;
  view: TaskView;
  onAnchorChange: (date: Date) => void;
  onToday: () => void;
};

export function TaskPeriodNav({ anchorDate, view, onAnchorChange, onToday }: TaskPeriodNavProps) {
  const label = formatPeriodLabel(anchorDate, view);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label="Periodo anterior"
        onClick={() => onAnchorChange(navigatePeriod(anchorDate, view, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="min-w-0 flex-1 text-center">
        <p key={label} className="auth-text-enter truncate text-sm font-semibold capitalize">
          {label}
        </p>
      </div>

      <Button variant="outline" size="sm" className="shrink-0 px-3" onClick={onToday}>
        Hoy
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label="Periodo siguiente"
        onClick={() => onAnchorChange(navigatePeriod(anchorDate, view, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
