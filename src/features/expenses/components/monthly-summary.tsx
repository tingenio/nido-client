"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";
import type { Expense } from "@/types";

export function MonthlySummary({ expenses }: { expenses: Expense[] }) {
  const { total, byCategory } = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = new Map<string, number>();
    for (const e of expenses) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    }
    return {
      total,
      byCategory: Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [expenses]);

  return (
    <Card className="bg-primary/5 ring-primary/10">
      <CardContent className="space-y-4 text-center">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Total del mes
          </p>
          <p className="text-primary mt-1 text-3xl font-semibold tabular-nums">
            {formatCurrencyWithSymbol(total)}
          </p>
        </div>
        {byCategory.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left">
            {byCategory.map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground truncate">{category}</span>
                <span className="shrink-0 tabular-nums font-medium">
                  {formatCurrencyWithSymbol(amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
