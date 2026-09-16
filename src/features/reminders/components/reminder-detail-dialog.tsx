"use client";

import { Bell, Clock, Trash2, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { UserLabel } from "@/components/ui/user-avatar";
import { DeleteReminderDialog } from "@/features/reminders/components/delete-reminder-dialog";
import { useReminderActions } from "@/features/reminders/hooks/use-reminder-actions";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";

type ReminderDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder;
};

export function ReminderDetailDialog({ open, onOpenChange, reminder }: ReminderDetailDialogProps) {
  const { appUser, canManage, toggleDone, handleDelete } = useReminderActions(reminder);
  const { members } = useHouseholdMembers();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!appUser) return null;

  const creator = members.find((member) => member.id === reminder.createdBy);

  const dueDate = reminder.dueAt.toDate();
  const isDone = Boolean(reminder.doneAt);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await handleDelete();
      setDeleteOpen(false);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  const footer = (
    <>
      {canManage && (
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
          Eliminar recordatorio
        </Button>
      )}
    </>
  );

  return (
    <>
      <DetailDialog
        open={open}
        onOpenChange={onOpenChange}
        title={
          <span className={cn(isDone && "text-muted-foreground line-through")}>{reminder.title}</span>
        }
        footer={canManage ? footer : undefined}
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
            <Checkbox
              checked={isDone}
              onCheckedChange={(checked) => toggleDone(Boolean(checked))}
            />
            <span className="text-sm font-medium">
              {isDone ? "Marcado como hecho" : "Marcar como hecho"}
            </span>
          </label>

          {reminder.description ? (
            <p className="text-sm leading-relaxed">{reminder.description}</p>
          ) : null}

          <div className="text-muted-foreground space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              {dueDate.toLocaleString("es", { dateStyle: "full", timeStyle: "short" })}
            </p>
            <p className="flex items-center gap-2">
              <Bell className="size-4 shrink-0" />
              Aviso {reminder.notifyBeforeMinutes} min antes
            </p>
            <p className="flex items-center gap-2">
              <User className="size-4 shrink-0" />
              {creator ? (
                <UserLabel name={creator.name} photoURL={creator.photoURL} />
              ) : (
                <span>Creado por —</span>
              )}
            </p>
          </div>
        </div>
      </DetailDialog>

      <DeleteReminderDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={reminder.title}
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
