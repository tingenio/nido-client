"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { SectionHeader } from "@/components/layout/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDayView } from "@/features/reminders/components/calendar-day-view";
import { CalendarMonthView } from "@/features/reminders/components/calendar-month-view";
import { CalendarNav } from "@/features/reminders/components/calendar-nav";
import { CalendarWeekView } from "@/features/reminders/components/calendar-week-view";
import { ReminderCard } from "@/features/reminders/components/reminder-card";
import {
  getRemindersForDay,
  type CalendarView,
} from "@/features/reminders/utils/calendar";
import type { Reminder } from "@/types";

type ReminderCalendarProps = {
  reminders: Reminder[];
  loading: boolean;
};

export function ReminderCalendar({ reminders, loading }: ReminderCalendarProps) {
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("month");

  function handleToday() {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDay(today);
  }

  function handleSelectDay(day: Date) {
    setSelectedDay(day);
    setAnchorDate(day);
  }

  const selectedDayReminders = getRemindersForDay(reminders, selectedDay);

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  if (reminders.length === 0) {
    return <EmptyState icon={Bell} message="No hay recordatorios para mostrar en el calendario." />;
  }

  return (
    <div className="space-y-4">
      <CalendarNav
        anchorDate={anchorDate}
        view={calendarView}
        onAnchorChange={setAnchorDate}
        onToday={handleToday}
      />

      <Tabs
        value={calendarView}
        onValueChange={(v) => setCalendarView(v as CalendarView)}
        className="space-y-4"
      >
        <TabsList className="h-11 w-full p-1">
          <TabsTrigger className="h-full flex-1 rounded-lg" value="day">
            Día
          </TabsTrigger>
          <TabsTrigger className="h-full flex-1 rounded-lg" value="week">
            Semana
          </TabsTrigger>
          <TabsTrigger className="h-full flex-1 rounded-lg" value="month">
            Mes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="page-enter mt-0">
          <CalendarDayView anchorDate={anchorDate} reminders={reminders} />
        </TabsContent>

        <TabsContent value="week" className="page-enter mt-0">
          <CalendarWeekView anchorDate={anchorDate} reminders={reminders} />
        </TabsContent>

        <TabsContent value="month" className="page-enter mt-0 space-y-4">
          <CalendarMonthView
            anchorDate={anchorDate}
            selectedDay={selectedDay}
            reminders={reminders}
            onSelectDay={handleSelectDay}
          />

          <div className="space-y-2">
            <SectionHeader
              title={format(selectedDay, "EEEE d MMMM", { locale: es })}
              count={selectedDayReminders.length}
            />
            {selectedDayReminders.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Sin recordatorios este día
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayReminders.map((reminder, index) => (
                  <div
                    key={reminder.id}
                    className="list-item-enter"
                    style={{ "--index": index } as React.CSSProperties}
                  >
                    <ReminderCard reminder={reminder} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
