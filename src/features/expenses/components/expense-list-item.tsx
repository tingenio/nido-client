import { Receipt } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Expense } from "@/types";

export function ExpenseListItem({ expense }: { expense: Expense }) {
  return (
    <Card>
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
          ${expense.amount.toLocaleString("es")}
        </p>
      </CardContent>
    </Card>
  );
}
