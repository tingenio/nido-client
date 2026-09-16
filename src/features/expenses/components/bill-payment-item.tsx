"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteBillPaymentDialog } from "@/features/expenses/components/delete-bill-payment-dialog";
import {
  deleteBillPayment,
  markBillPaymentPaid,
  markBillPaymentUnpaid,
} from "@/features/expenses/bill-actions";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { getIdToken } from "@/lib/auth/get-id-token";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import type { BillPayment } from "@/types";

type BillPaymentItemProps = {
  payment: BillPayment;
  kindLabel: string;
  deletable?: boolean;
  onUpdated?: () => void;
};

export function BillPaymentItem({
  payment,
  kindLabel,
  deletable = false,
  onUpdated,
}: BillPaymentItemProps) {
  const { members } = useHouseholdMembers();
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isPaid = payment.status === "paid";
  const payer = members.find((m) => m.id === payment.paidBy);

  const meta =
    [
      payment.dueDay && payment.dueDay < 99 ? `Vence día ${payment.dueDay}` : "Sin fecha fija",
      isPaid && payer ? `Pagado por ${payer.name}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || null;

  async function handleToggle(checked: boolean) {
    setBusy(true);
    try {
      const idToken = await getIdToken();
      if (checked) {
        await markBillPaymentPaid({ idToken, paymentId: payment.id });
        toast.success(`${payment.name} marcado como pagado`);
      } else {
        await markBillPaymentUnpaid({ idToken, paymentId: payment.id });
        toast.success(`${payment.name} marcado como pendiente`);
      }
      onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    setBusy(true);
    try {
      const idToken = await getIdToken();
      await deleteBillPayment({ idToken, paymentId: payment.id });
      toast.success(`${payment.name} eliminado`);
      setDeleteOpen(false);
      onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className={cn(isPaid && "opacity-80")}>
        <CardContent className="flex items-start gap-3 py-3">
          <Checkbox
            checked={isPaid}
            disabled={busy}
            onCheckedChange={(checked) => handleToggle(Boolean(checked))}
            className="mt-0.5 size-5 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "min-w-0 flex-1 truncate font-medium",
                  isPaid && "text-muted-foreground line-through",
                )}
              >
                {payment.name}
              </p>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatCurrencyWithSymbol(payment.amount)}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {kindLabel}
              </Badge>
              <Badge variant={isPaid ? "success" : "outline"} className="text-[10px]">
                {isPaid ? "Pagado" : "Pendiente"}
              </Badge>
              {deletable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  onClick={() => setDeleteOpen(true)}
                  aria-label={`Eliminar ${payment.name}`}
                  className="size-7"
                >
                  <Trash2 className="text-muted-foreground size-3.5" />
                </Button>
              )}
            </div>
            {meta ? <p className="text-muted-foreground mt-1 truncate text-xs">{meta}</p> : null}
          </div>
        </CardContent>
      </Card>

      <DeleteBillPaymentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        payment={payment}
        loading={busy}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
