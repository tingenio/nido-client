"use client";

import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createExpense } from "@/features/expenses/actions";
import { useFunds } from "@/features/expenses/hooks/use-funds";
import { getIdToken } from "@/lib/auth/get-id-token";
import { EXPENSE_FREQUENCY_LABELS, resolveLabel } from "@/lib/labels";
import type { ExpenseFrequency, ExpenseType } from "@/types";

const frequencies = Object.entries(EXPENSE_FREQUENCY_LABELS).map(([value, label]) => ({
  value: value as ExpenseFrequency,
  label,
}));

const NO_FUND = "none";

type CreateExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateExpenseDialog({ open, onOpenChange }: CreateExpenseDialogProps) {
  const { funds } = useFunds();
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState<ExpenseType>("variable");
  const [frequency, setFrequency] = useState<ExpenseFrequency>("monthly");
  const [fundId, setFundId] = useState<string>(NO_FUND);

  function reset() {
    setAmount(0);
    setCategory("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setType("variable");
    setFrequency("monthly");
    setFundId(NO_FUND);
  }

  async function handleSubmit() {
    if (amount <= 0 || !category.trim()) {
      toast.error("Completa el monto y la categoría");
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await createExpense({
        idToken,
        amount,
        category: category.trim(),
        description: description.trim() || undefined,
        date,
        type,
        frequency: type === "recurring" ? frequency : undefined,
        fundId: fundId === NO_FUND ? undefined : fundId,
      });
      toast.success("Gasto registrado");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el gasto");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo gasto</DialogTitle>
          <DialogDescription>
            Si lo asocias a un fondo, se descuenta de su saldo disponible.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Monto</Label>
            <Input
              id="expense-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-category">Categoría</Label>
            <Input
              id="expense-category"
              placeholder="Ej: Mercado, Servicios, Ocio"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-description">Descripción (opcional)</Label>
            <Input
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-date">Fecha</Label>
            <Input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as ExpenseType)}>
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="variable">
                  Variable
                </TabsTrigger>
                <TabsTrigger className="flex-1" value="recurring">
                  Recurrente
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {type === "recurring" && (
            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as ExpenseFrequency)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {resolveLabel(EXPENSE_FREQUENCY_LABELS, frequency)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Fondo (opcional)</Label>
            <Select value={fundId} onValueChange={(v) => setFundId(v ?? NO_FUND)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Gasto general de la casa">
                  {fundId === NO_FUND
                    ? "Gasto general (sin fondo)"
                    : (() => {
                        const fund = funds.find((f) => f.id === fundId);
                        return fund
                          ? `${fund.name} · $${fund.balance.toLocaleString("es")}`
                          : undefined;
                      })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_FUND}>Gasto general (sin fondo)</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name} · ${fund.balance.toLocaleString("es")}
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
            Registrar gasto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
