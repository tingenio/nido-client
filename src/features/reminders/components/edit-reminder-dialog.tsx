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
import { Textarea } from "@/components/ui/textarea";
import { updateReminder } from "@/features/reminders/actions";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import {
  dateToDatetimeLocal,
  datetimeLocalToISO,
  formatDatetimeLocalPreview,
  minDatetimeLocalValue,
} from "@/lib/format/datetime";
import type { Reminder } from "@/types";

type EditReminderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder;
};

export function EditReminderDialog({ open, onOpenChange, reminder }: EditReminderDialogProps) {
  const { appUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notifyBefore, setNotifyBefore] = useState(30);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(reminder.title);
      setDescription(reminder.description ?? "");
      setDueAt(dateToDatetimeLocal(reminder.dueAt.toDate()));
      setNotifyBefore(reminder.notifyBeforeMinutes);
    }
  }

  async function handleSubmit() {
    if (!appUser) return;
    if (!title.trim() || !dueAt) {
      toast.error("Completa el título y la fecha");
      return;
    }

    let dueAtISO: string;
    try {
      dueAtISO = datetimeLocalToISO(dueAt);
    } catch {
      toast.error("La fecha no es válida");
      return;
    }

    if (new Date(dueAtISO) < new Date()) {
      toast.error("La fecha debe ser en el futuro");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await updateReminder({
        idToken,
        reminderId: reminder.id,
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAtISO,
        notifyBeforeMinutes: notifyBefore,
      });
      toast.success("Recordatorio actualizado");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar recordatorio</DialogTitle>
          <DialogDescription>Actualiza los datos del aviso.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-reminder-title">Título</Label>
              <Input
                id="edit-reminder-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reminder-description">Descripción (opcional)</Label>
              <Textarea
                id="edit-reminder-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reminder-due">Fecha y hora</Label>
              <Input
                id="edit-reminder-due"
                type="datetime-local"
                min={minDatetimeLocalValue()}
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
              {formatDatetimeLocalPreview(dueAt) ? (
                <p className="text-muted-foreground text-xs">
                  {formatDatetimeLocalPreview(dueAt)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reminder-notify">Avisar con anticipación (minutos)</Label>
              <Input
                id="edit-reminder-notify"
                type="number"
                min={0}
                value={notifyBefore}
                onChange={(e) => setNotifyBefore(Number(e.target.value))}
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
