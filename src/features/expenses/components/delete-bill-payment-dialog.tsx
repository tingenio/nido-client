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
import type { BillPayment } from "@/types";

type DeleteBillPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: BillPayment;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function DeleteBillPaymentDialog({
  open,
  onOpenChange,
  payment,
  loading,
  onConfirm,
}: DeleteBillPaymentDialogProps) {
  const isRecurring = payment.expenseType !== "variable";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>¿Eliminar pago?</DialogTitle>
          <DialogDescription>
            Se borrará &quot;{payment.name}&quot; ({formatCurrencyWithSymbol(payment.amount)}).
            {isRecurring
              ? " Dejará de repetirse en los meses siguientes."
              : " Solo se elimina de este mes."}{" "}
            Esta acción no se puede deshacer.
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
