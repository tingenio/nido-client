"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteNoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function DeleteNoteDialog({
  open,
  onOpenChange,
  title,
  loading,
  onConfirm,
}: DeleteNoteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="¿Eliminar nota?"
      description={`Se borrará "${title}" del hogar. Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
