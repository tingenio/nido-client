"use client";

import { ListSkeleton } from "@/components/layout/list-skeleton";
import { LunchDayCard } from "@/features/lunch-menu/components/lunch-day-card";
import { WEEKDAYS, type LunchMenuEntry, type Weekday } from "@/types";

// getDay() -> 0=domingo..6=sábado; WEEKDAYS empieza en lunes.
const JS_DAY_TO_WEEKDAY: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type LunchMenuListProps = {
  menu: Partial<Record<Weekday, LunchMenuEntry>>;
  loading: boolean;
  canEdit: boolean;
};

export function LunchMenuList({ menu, loading, canEdit }: LunchMenuListProps) {
  if (loading) {
    return <ListSkeleton count={7} />;
  }

  const today = JS_DAY_TO_WEEKDAY[new Date().getDay()];

  return (
    <div className="space-y-2">
      {WEEKDAYS.map((weekday) => (
        <LunchDayCard
          key={weekday}
          weekday={weekday}
          entry={menu[weekday]}
          isToday={weekday === today}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
