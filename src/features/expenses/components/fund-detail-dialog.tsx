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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFundIncome } from "@/features/expenses/actions";
import { useFundMovements } from "@/features/expenses/hooks/use-fund-movements";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
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
      setIncomeOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo recargar");
    } finally {
      setSubmitting(false);
    }
  }

  const footer =
    appUser?.role === "admin" ? (
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
            : `$${fund.balance.toLocaleString("es")} disponibles`
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
              ${fund.balance.toLocaleString("es")}
            </p>
            <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  fund.balance <= 0 ? "bg-destructive/60" : "bg-[var(--brand-sage)]",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
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
                          movement.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
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
                      {movement.type === "income" ? "+" : "-"}${movement.amount.toLocaleString("es")}
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
                <Input
                  id={`amount-detail-${fund.id}`}
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
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
    </>
  );
}
