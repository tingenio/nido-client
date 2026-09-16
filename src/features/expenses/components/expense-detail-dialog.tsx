"use client";

import { Calendar, Receipt, Tag, User, Wallet } from "lucide-react";

import { DetailDialog } from "@/components/ui/detail-dialog";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { useFunds } from "@/features/expenses/hooks/use-funds";
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
  const { members } = useHouseholdMembers();
  const { funds } = useFunds();

  const creator = members.find((m) => m.id === expense.createdBy);
  const fund = funds.find((f) => f.id === expense.fundId);

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={expense.category}
      description={
        expense.description ? expense.description : `Gasto ${expenseTypeLabel[expense.type].toLowerCase()}`
      }
    >
      <div className="space-y-4">
        <p className="text-2xl font-semibold tabular-nums">
          ${expense.amount.toLocaleString("es")}
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
            <User className="size-4 shrink-0" />
            Registrado por {creator?.name ?? "—"}
          </p>
          <p className="flex items-center gap-2">
            <Receipt className="size-4 shrink-0" />
            {expense.description || "Sin descripción adicional"}
          </p>
        </div>
      </div>
    </DetailDialog>
  );
}
