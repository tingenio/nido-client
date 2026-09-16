"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFundIncome, updateFundTarget } from "@/features/expenses/actions";
import { useFundMovements } from "@/features/expenses/hooks/use-fund-movements";
import { getFundProgress } from "@/features/expenses/lib/fund-progress";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import type { Fund } from "@/types";

type FundDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund: Fund;
};

export function FundDetailDialog({ open, onOpenChange, fund }: FundDetailDialogProps) {
  const { appUser } = useAuth();
  const { members } = useHouseholdMembers();
  const { movements, loading } = useFundMovements(open ? fund.id : null);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [description, setDescription] = useState("Recarga de fondo");
  const [targetAmount, setTargetAmount] = useState<number | null>(fund.targetAmount ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [targetSubmitting, setTargetSubmitting] = useState(false);

  const progress = getFundProgress(fund);
  const isAdmin = appUser?.role === "admin";

  async function handleAddIncome() {
    if (!amount || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await addFundIncome({ idToken, fundId: fund.id, amount, description });
      toast.success("Fondo recargado");
      setAmount(null);
      setIncomeOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo recargar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateTarget(remove = false) {
    if (!remove && (!targetAmount || targetAmount <= 0)) {
      toast.error("Ingresa una meta válida");
      return;
    }
    setTargetSubmitting(true);
    try {
      const idToken = await getIdToken();
      await updateFundTarget({
        idToken,
        fundId: fund.id,
        targetAmount: remove ? null : targetAmount,
      });
      toast.success(remove ? "Meta eliminada" : "Meta actualizada");
      if (remove) setTargetAmount(null);
      setTargetOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la meta");
    } finally {
      setTargetSubmitting(false);
    }
  }

  function openTargetDialog() {
    setTargetAmount(fund.targetAmount ?? null);
    setTargetOpen(true);
  }

  const footer = isAdmin ? (
    <Button className="w-full" onClick={() => setIncomeOpen(true)}>
      Ingresar fondos
    </Button>
  ) : undefined;

  return (
    <>
      <DetailDialog
        open={open}
        onOpenChange={onOpenChange}
        title={fund.name}
        description={
          fund.balance <= 0
            ? "Sin saldo disponible"
            : `${formatCurrencyWithSymbol(fund.balance)} disponibles`
        }
        footer={footer}
      >
        <div className="space-y-4">
          <div>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                fund.balance <= 0 ? "text-destructive" : "",
              )}
            >
              {formatCurrencyWithSymbol(fund.balance)}
            </p>

            {progress.hasTarget && (
              <>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-muted-foreground text-xs tabular-nums">{progress.label}</p>
                  {progress.targetReached && (
                    <span className="text-xs font-medium text-emerald-700">Meta alcanzada</span>
                  )}
                </div>
                <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      progress.targetReached ? "bg-emerald-600" : "bg-[var(--brand-sage)]",
                    )}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </>
            )}

            {isAdmin && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">Meta de ahorro</p>
                  <p className="text-muted-foreground truncate text-xs tabular-nums">
                    {fund.targetAmount
                      ? formatCurrencyWithSymbol(fund.targetAmount)
                      : "Sin meta definida"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={openTargetDialog}>
                  Editar meta
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Movimientos recientes</p>
            {loading ? (
              <p className="text-muted-foreground text-sm">Cargando movimientos…</p>
            ) : movements.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin movimientos todavía.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {movements.map((movement) => {
                  const author = members.find((member) => member.id === movement.createdBy);

                  return (
                    <li key={movement.id} className="flex items-start gap-3 px-3 py-2.5">
                      {author ? (
                        <UserAvatar
                          name={author.name}
                          photoURL={author.photoURL}
                          size="sm"
                          className="mt-0.5 size-7"
                        />
                      ) : (
                        <div
                          className={cn(
                            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                            movement.type === "income"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700",
                          )}
                        >
                          {movement.type === "income" ? (
                            <ArrowDownLeft className="size-3.5" />
                          ) : (
                            <ArrowUpRight className="size-3.5" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{movement.description}</p>
                        <p className="text-muted-foreground text-xs">
                          {author ? `${author.name} · ` : ""}
                          {movement.createdAt.toDate().toLocaleString("es", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          movement.type === "income" ? "text-emerald-700" : "text-red-700",
                        )}
                      >
                        {movement.type === "income" ? "+" : "-"}
                        {formatCurrencyWithSymbol(movement.amount)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DetailDialog>

      <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar a {fund.name}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`amount-detail-${fund.id}`}>Monto</Label>
                <CurrencyInput
                  id={`amount-detail-${fund.id}`}
                  value={amount}
                  onValueChange={setAmount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`desc-detail-${fund.id}`}>Descripción</Label>
                <Input
                  id={`desc-detail-${fund.id}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button disabled={submitting} onClick={handleAddIncome}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={targetOpen} onOpenChange={setTargetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meta de ahorro</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-2">
              <Label htmlFor={`target-detail-${fund.id}`}>Monto objetivo</Label>
              <CurrencyInput
                id={`target-detail-${fund.id}`}
                value={targetAmount}
                onValueChange={setTargetAmount}
              />
              <p className="text-muted-foreground text-xs">
                Cuánto quieres acumular en este fondo.
              </p>
            </div>
          </DialogBody>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {fund.targetAmount != null && (
              <Button
                variant="ghost"
                className="text-destructive sm:mr-auto"
                disabled={targetSubmitting}
                onClick={() => handleUpdateTarget(true)}
              >
                Quitar meta
              </Button>
            )}
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button disabled={targetSubmitting} onClick={() => handleUpdateTarget(false)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
