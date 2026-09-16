"use client";

import { addMonths, format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type MonthNavProps = {
  month: string;
  onMonthChange: (month: string) => void;
};

function parseMonth(month: string): Date {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year!, monthIndex! - 1, 1);
}

export function MonthNav({ month, onMonthChange }: MonthNavProps) {
  const date = parseMonth(month);
  const label = format(date, "MMMM yyyy", { locale: es });
  const currentMonth = format(new Date(), "yyyy-MM");

  return (
    <div className="flex w-full min-w-0 items-center gap-1.5">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label="Mes anterior"
        onClick={() => onMonthChange(format(subMonths(date, 1), "yyyy-MM"))}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="min-w-0 flex-1 text-center">
        <p key={month} className="auth-text-enter truncate text-sm font-semibold capitalize">
          {label}
        </p>
      </div>

      {month !== currentMonth && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 px-2 text-xs"
          onClick={() => onMonthChange(currentMonth)}
        >
          Hoy
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label="Mes siguiente"
        onClick={() => onMonthChange(format(addMonths(date, 1), "yyyy-MM"))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
