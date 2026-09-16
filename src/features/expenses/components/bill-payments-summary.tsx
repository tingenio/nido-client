"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";

type PendingSummary = {
  count: number;
  amount: number;
};

export function BillPaymentsSummary({ pending }: { pending: PendingSummary }) {
  if (pending.count === 0) return null;

  return (
    <Card className="bg-primary/5 ring-primary/10">
      <CardContent className="space-y-1 py-4 text-center">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Por pagar
        </p>
        <p className="text-primary text-2xl font-semibold tabular-nums">
          {pending.count} pendiente{pending.count === 1 ? "" : "s"}
        </p>
        <p className="text-muted-foreground text-sm">
          {formatCurrencyWithSymbol(pending.amount)}
        </p>
      </CardContent>
    </Card>
  );
}
