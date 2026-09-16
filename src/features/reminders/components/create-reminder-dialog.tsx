"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";

type CreateReminderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateReminderDialog({ open, onOpenChange }: CreateReminderDialogProps) {
  const { appUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notifyBefore, setNotifyBefore] = useState(30);

  async function handleSubmit() {
    if (!appUser) return;
    if (!title.trim() || !dueAt) {
      toast.error("Completa el título y la fecha");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "households", appUser.householdId, "reminders"), {
        title: title.trim(),
        description: description.trim() || null,
        dueAt: new Date(dueAt),
        notifyBeforeMinutes: notifyBefore,
        createdBy: appUser.id,
        doneAt: null,
        notifiedAt: null,
        createdAt: serverTimestamp(),
      });
      toast.success("Recordatorio creado");
      setTitle("");
      setDescription("");
      setDueAt("");
      setNotifyBefore(30);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo recordatorio</DialogTitle>
          <DialogDescription>Visible para todo el hogar.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reminder-title">Título</Label>
              <Input id="reminder-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-description">Descripción (opcional)</Label>
              <Textarea
                id="reminder-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-due">Fecha y hora</Label>
              <Input
                id="reminder-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-notify">Avisar con anticipación (minutos)</Label>
              <Input
                id="reminder-notify"
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
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
