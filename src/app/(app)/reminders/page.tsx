"use client";

import { Bell, CalendarDays, List } from "lucide-react";
import { useState } from "react";

import { CreateAction } from "@/components/layout/create-action";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateReminderDialog } from "@/features/reminders/components/create-reminder-dialog";
import { ReminderCalendar } from "@/features/reminders/components/reminder-calendar";
import { ReminderListView } from "@/features/reminders/components/reminder-list-view";
import { useReminders } from "@/features/reminders/hooks/use-reminders";

const VIEW_STORAGE_KEY = "nido:reminders-view";

type RemindersViewMode = "list" | "calendar";

function getInitialViewMode(): RemindersViewMode {
  if (typeof window === "undefined") return "list";
  const stored = localStorage.getItem(VIEW_STORAGE_KEY);
  return stored === "calendar" ? "calendar" : "list";
}

export default function RemindersPage() {
  const { reminders, loading } = useReminders();
  const [viewMode, setViewMode] = useState<RemindersViewMode>(getInitialViewMode);

  function handleViewChange(value: string) {
    const mode = value as RemindersViewMode;
    setViewMode(mode);
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recordatorios"
        description="Avisos compartidos para todo el hogar."
      />

      <CreateAction label="Nuevo recordatorio" icon={Bell}>
        {({ open, onOpenChange }) => (
          <CreateReminderDialog open={open} onOpenChange={onOpenChange} />
        )}
      </CreateAction>

      <Tabs value={viewMode} onValueChange={handleViewChange} className="space-y-4">
        <TabsList className="h-11 w-full p-1">
          <TabsTrigger className="h-full flex-1 gap-1.5 rounded-lg" value="list">
            <List className="size-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger className="h-full flex-1 gap-1.5 rounded-lg" value="calendar">
            <CalendarDays className="size-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0 space-y-6">
          <ReminderListView reminders={reminders} loading={loading} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <ReminderCalendar reminders={reminders} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
