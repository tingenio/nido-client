"use client";

import { ChefHat, Pencil } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditLunchDayDialog } from "@/features/lunch-menu/components/edit-lunch-day-dialog";
import { WEEKDAY_LABELS, type LunchMenuEntry, type Weekday } from "@/types";
import { cn } from "@/lib/utils";

type LunchDayCardProps = {
  weekday: Weekday;
  entry?: LunchMenuEntry;
  isToday: boolean;
  canEdit: boolean;
};

export function LunchDayCard({ weekday, entry, isToday, canEdit }: LunchDayCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card className={cn(isToday && "ring-2 ring-primary/40")}>
        <CardContent className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-medium leading-tight">{WEEKDAY_LABELS[weekday]}</p>
              {isToday && (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                  Hoy
                </span>
              )}
            </div>
            {entry?.meal ? (
              <p className="text-sm leading-snug">{entry.meal}</p>
            ) : (
              <p className="text-muted-foreground text-sm">Sin definir</p>
            )}
            {entry?.assignedTo && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                <ChefHat className="size-3 shrink-0" />
                {entry.assignedTo}
              </p>
            )}
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${WEEKDAY_LABELS[weekday]}`}
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <EditLunchDayDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          weekday={weekday}
          entry={entry}
        />
      )}
    </>
  );
}
