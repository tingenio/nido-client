"use client";

import { Loader2 } from "lucide-react";

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
import { formatCurrencyWithSymbol } from "@/lib/format/currency";
import type { Expense } from "@/types";

type DeleteExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function DeleteExpenseDialog({
  open,
  onOpenChange,
  expense,
  loading,
  onConfirm,
}: DeleteExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>¿Eliminar gasto?</DialogTitle>
          <DialogDescription>
            Se borrará &quot;{expense.category}&quot; ({formatCurrencyWithSymbol(expense.amount)}).
            Si proviene de un pago fijo marcado como pagado, volverá a la lista de pendientes. Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={loading} />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            disabled={loading}
            className="gap-2"
            onClick={() => void onConfirm()}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
