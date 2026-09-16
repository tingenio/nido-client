"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { FundDetailDialog } from "@/features/expenses/components/fund-detail-dialog";
import { getFundProgress } from "@/features/expenses/lib/fund-progress";
import { formatCurrencyWithSymbol } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import type { Fund } from "@/types";

export function FundCard({ fund }: { fund: Fund }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const progress = getFundProgress(fund);

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
                {fund.balance <= 0 ? "Sin saldo · " : ""}
                {formatCurrencyWithSymbol(fund.balance)}
              </p>
              {progress.hasTarget && progress.label && (
                <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">{progress.label}</p>
              )}
            </div>
          </div>

          {progress.hasTarget && (
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  progress.targetReached ? "bg-emerald-600" : "bg-[var(--brand-sage)]",
                )}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <FundDetailDialog open={detailOpen} onOpenChange={setDetailOpen} fund={fund} />
    </>
  );
}
