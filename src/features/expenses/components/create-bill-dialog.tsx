"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { createBill } from "@/features/expenses/bill-actions";
import { useFunds } from "@/features/expenses/hooks/use-funds";
import { getIdToken } from "@/lib/auth/get-id-token";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";

const NO_FUND = "none";

type CreateBillDialogProps = {
  month: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return format(new Date(year!, monthIndex! - 1, 1), "MMMM yyyy", { locale: es });
}

export function CreateBillDialog({ month, open, onOpenChange, onCreated }: CreateBillDialogProps) {
  const { funds } = useFunds();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [dueDay, setDueDay] = useState("");
  const [fundId, setFundId] = useState(NO_FUND);

  const monthLabel = formatMonthLabel(month);

  function reset() {
    setName("");
    setAmount(null);
    setDueDay("");
    setFundId(NO_FUND);
  }

  async function handleSubmit() {
    if (!name.trim() || !amount || amount <= 0) {
      toast.error("Completa el nombre y el monto");
      return;
    }

    if (!dueDay.trim()) {
      toast.error("Indica el día del mes en que se paga (1–31)");
      return;
    }

    const parsedDueDay = Number(dueDay);
    if (!Number.isFinite(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      toast.error("El día de pago debe estar entre 1 y 31");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await createBill({
        idToken,
        month,
        name: name.trim(),
        amount,
        dueDay: parsedDueDay,
        fundId: fundId === NO_FUND ? undefined : fundId,
      });
      toast.success("Pago fijo agregado");
      onCreated?.();
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
          <DialogTitle>Pago fijo mensual</DialogTitle>
          <DialogDescription>
            Se repetirá cada mes (arriendo, créditos, servicios, etc.). La primera cuota aparecerá
            en {monthLabel}.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="bill-name">Nombre</Label>
              <Input
                id="bill-name"
                placeholder="Ej: Arriendo, Crédito hipoteca, Internet"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bill-amount">Monto</Label>
              <CurrencyInput id="bill-amount" value={amount} onValueChange={setAmount} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bill-due-day">Día de pago del mes</Label>
              <Input
                id="bill-due-day"
                type="number"
                min={1}
                max={31}
                required
                placeholder="Ej: 5"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
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
            Agregar pago fijo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
