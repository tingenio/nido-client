"use client";

import { Receipt } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { ExpenseDetailDialog } from "@/features/expenses/components/expense-detail-dialog";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";
import type { Expense } from "@/types";

export function ExpenseListItem({ expense }: { expense: Expense }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
      >
        <CardContent className="flex items-center gap-3">
          <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Receipt className="text-muted-foreground size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{expense.category}</p>
            <p className="text-muted-foreground truncate text-xs">
              {expense.date}
              {expense.description ? ` · ${expense.description}` : ""}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">
            {formatCurrencyWithSymbol(expense.amount)}
          </p>
        </CardContent>
      </Card>

      <ExpenseDetailDialog open={detailOpen} onOpenChange={setDetailOpen} expense={expense} />
    </>
  );
}
