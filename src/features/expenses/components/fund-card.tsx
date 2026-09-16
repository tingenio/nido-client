"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFundIncome } from "@/features/expenses/actions";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import { cn } from "@/lib/utils";
import type { Fund } from "@/types";

export function FundCard({ fund }: { fund: Fund }) {
  const { appUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("Recarga de fondo");
  const [submitting, setSubmitting] = useState(false);

  const progress =
    fund.balance <= 0 ? 0 : Math.min(100, Math.max(12, (fund.balance / 10000) * 100));

  async function handleAddIncome() {
    if (amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await addFundIncome({ idToken, fundId: fund.id, amount, description });
      toast.success("Fondo recargado");
      setAmount(0);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo recargar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{fund.name}</p>
            <p
              className={cn(
                "text-sm tabular-nums",
                fund.balance <= 0 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {fund.balance <= 0 ? "Sin saldo · " : ""}${fund.balance.toLocaleString("es")}
            </p>
          </div>

          {appUser?.role === "admin" && (
            <Button variant="outline" onClick={() => setOpen(true)}>
              Ingresar fondos
            </Button>
          )}
        </div>

        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              fund.balance <= 0 ? "bg-destructive/60" : "bg-[var(--brand-sage)]",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar a {fund.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`amount-${fund.id}`}>Monto</Label>
              <Input
                id={`amount-${fund.id}`}
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`desc-${fund.id}`}>Descripción</Label>
              <Input
                id={`desc-${fund.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button disabled={submitting} onClick={handleAddIncome}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
