"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setLunchDay } from "@/features/lunch-menu/actions";
import { getIdToken } from "@/lib/auth/get-id-token";
import { WEEKDAY_LABELS, type LunchMenuEntry, type Weekday } from "@/types";

type EditLunchDayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekday: Weekday;
  entry?: LunchMenuEntry;
};

export function EditLunchDayDialog({ open, onOpenChange, weekday, entry }: EditLunchDayDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [meal, setMeal] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMeal(entry?.meal ?? "");
      setAssignedTo(entry?.assignedTo ?? "");
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await setLunchDay({ idToken, weekday, meal, assignedTo: assignedTo.trim() || undefined });
      toast.success("Menú actualizado");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{WEEKDAY_LABELS[weekday]}</DialogTitle>
          <DialogDescription>Qué se cocina ese día, visible para todo el hogar.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="lunch-day-meal">Almuerzo</Label>
              <Input
                id="lunch-day-meal"
                placeholder="Ej. Arroz con pollo y ensalada"
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">Deja el campo vacío para borrar el día.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lunch-day-assigned">Quién cocina (opcional)</Label>
              <Input
                id="lunch-day-assigned"
                placeholder="Ej. Mamá"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button disabled={submitting} onClick={handleSubmit}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
