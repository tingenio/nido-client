"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPlannedExpense } from "@/features/expenses/bill-actions";
import { useFunds } from "@/features/expenses/hooks/use-funds";
import { getIdToken } from "@/lib/auth/get-id-token";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";

const NO_FUND = "none";

type CreatePlannedExpenseDialogProps = {
  month: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreatePlannedExpenseDialog({
  month,
  open,
  onOpenChange,
}: CreatePlannedExpenseDialogProps) {
  const { funds } = useFunds();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [fundId, setFundId] = useState<string>(NO_FUND);

  function reset() {
    setName("");
    setAmount(null);
    setFundId(NO_FUND);
  }

  async function handleSubmit() {
    if (!name.trim() || !amount || amount <= 0) {
      toast.error("Completa el nombre y el monto");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await createPlannedExpense({
        idToken,
        month,
        name: name.trim(),
        amount,
        fundId: fundId === NO_FUND ? undefined : fundId,
      });
      toast.success("Pago del mes agregado");
      reset();
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
          <DialogTitle>Pago solo este mes</DialogTitle>
          <DialogDescription>
            Aparecerá únicamente en {month}. Al marcarlo pagado se registra el gasto.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="planned-name">Nombre</Label>
              <Input
                id="planned-name"
                placeholder="Ej: Reparación, Colegiatura extra, Regalo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planned-amount">Monto</Label>
              <CurrencyInput id="planned-amount" value={amount} onValueChange={setAmount} />
            </div>

            <div className="space-y-2">
              <Label>Descontar del fondo al pagar (opcional)</Label>
              <Select value={fundId} onValueChange={(v) => setFundId(v ?? NO_FUND)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin fondo asociado">
                    {fundId === NO_FUND
                      ? "Sin fondo asociado"
                      : funds.find((f) => f.id === fundId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_FUND}>Sin fondo asociado</SelectItem>
                  {funds.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id}>
                      {fund.name} · {formatCurrencyWithSymbol(fund.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button disabled={submitting} onClick={handleSubmit}>
            Agregar pago del mes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
