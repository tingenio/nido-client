"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteReminderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function DeleteReminderDialog({
  open,
  onOpenChange,
  title,
  loading,
  onConfirm,
}: DeleteReminderDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="¿Eliminar recordatorio?"
      description={`Se borrará "${title}" del hogar. Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
