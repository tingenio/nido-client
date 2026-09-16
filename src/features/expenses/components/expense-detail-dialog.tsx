"use client";

import { Calendar, Receipt, Tag, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { UserLabel } from "@/components/ui/user-avatar";
import { deleteExpense } from "@/features/expenses/actions";
import { DeleteExpenseDialog } from "@/features/expenses/components/delete-expense-dialog";
import { useFunds } from "@/features/expenses/hooks/use-funds";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";
import type { Expense } from "@/types";

const expenseTypeLabel: Record<Expense["type"], string> = {
  recurring: "Recurrente",
  variable: "Variable",
};

const frequencyLabel: Record<NonNullable<Expense["frequency"]>, string> = {
  monthly: "Mensual",
  biweekly: "Quincenal",
  weekly: "Semanal",
  yearly: "Anual",
};

type ExpenseDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
};

export function ExpenseDetailDialog({ open, onOpenChange, expense }: ExpenseDetailDialogProps) {
  const { appUser } = useAuth();
  const { members } = useHouseholdMembers();
  const { funds } = useFunds();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const creator = members.find((m) => m.id === expense.createdBy);
  const fund = funds.find((f) => f.id === expense.fundId);
  const canDelete = appUser?.role !== "external";

  async function handleDelete() {
    setBusy(true);
    try {
      const idToken = await getIdToken();
      await deleteExpense({ idToken, expenseId: expense.id });
      toast.success("Gasto eliminado");
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DetailDialog
        open={open}
        onOpenChange={onOpenChange}
        title={expense.category}
        description={
          expense.description ? expense.description : `Gasto ${expenseTypeLabel[expense.type].toLowerCase()}`
        }
        footer={
          canDelete ? (
            <Button
              variant="destructive"
              className="w-full gap-2"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Eliminar gasto
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrencyWithSymbol(expense.amount)}
          </p>

          <div className="text-muted-foreground space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Calendar className="size-4 shrink-0" />
              {expense.date}
            </p>
            <p className="flex items-center gap-2">
              <Tag className="size-4 shrink-0" />
              {expenseTypeLabel[expense.type]}
              {expense.frequency ? ` · ${frequencyLabel[expense.frequency]}` : ""}
            </p>
            <p className="flex items-center gap-2">
              <Wallet className="size-4 shrink-0" />
              {fund ? fund.name : "Gasto general del hogar"}
            </p>
            <p className="flex items-center gap-2">
              <span className="shrink-0">Registrado por</span>
              {creator ? (
                <UserLabel name={creator.name} photoURL={creator.photoURL} />
              ) : (
                <span>—</span>
              )}
            </p>
            <p className="flex items-center gap-2">
              <Receipt className="size-4 shrink-0" />
              {expense.description || "Sin descripción adicional"}
            </p>
          </div>
        </div>
      </DetailDialog>

      <DeleteExpenseDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        expense={expense}
        loading={busy}
        onConfirm={handleDelete}
      />
    </>
  );
}
