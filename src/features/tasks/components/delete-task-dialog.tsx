"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { TaskOccurrence, TaskType } from "@/types";

type DeleteMode = "occurrence" | "series";

type DeleteTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrence: TaskOccurrence;
  taskType: TaskType | null;
  assigneeName?: string;
  loading?: boolean;
  onConfirm: (mode: DeleteMode) => void | Promise<void>;
};

export function DeleteTaskDialog({
  open,
  onOpenChange,
  occurrence,
  taskType,
  assigneeName,
  loading,
  onConfirm,
}: DeleteTaskDialogProps) {
  const isRecurring = taskType === "recurring";
  const [mode, setMode] = useState<DeleteMode>("occurrence");

  useEffect(() => {
    if (open) setMode("occurrence");
  }, [open]);

  const verified = occurrence.status === "verified";
  const pointsToReverse = verified ? (occurrence.pointsAwarded ?? occurrence.points) : 0;

  let description = `Se borrará "${occurrence.title}" del hogar. Esta acción no se puede deshacer.`;
  if (verified && pointsToReverse > 0) {
    description = `Se borrará "${occurrence.title}" y se restarán ${pointsToReverse} pts de ${assigneeName ?? "quien los recibió"}. Esta acción no se puede deshacer.`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>¿Eliminar tarea?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isRecurring && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Esta tarea se repite. ¿Qué deseas hacer?</p>
            <div className="space-y-2">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  mode === "occurrence" && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="delete-mode"
                  checked={mode === "occurrence"}
                  onChange={() => setMode("occurrence")}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Solo esta vez</span>
                  <span className="text-muted-foreground block text-xs">
                    Elimina la tarea del {occurrence.date}. Las demás fechas siguen igual.
                  </span>
                </span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  mode === "series" && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="delete-mode"
                  checked={mode === "series"}
                  onChange={() => setMode("series")}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Dejar de repetir</span>
                  <span className="text-muted-foreground block text-xs">
                    Elimina esta instancia y cancela las repeticiones futuras.
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={loading} />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            disabled={loading}
            className="gap-2"
            onClick={() => void onConfirm(isRecurring ? mode : "occurrence")}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
