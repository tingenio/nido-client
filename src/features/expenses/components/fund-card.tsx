"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { FundDetailDialog } from "@/features/expenses/components/fund-detail-dialog";
import { cn } from "@/lib/utils";
import type { Fund } from "@/types";

export function FundCard({ fund }: { fund: Fund }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const progress =
    fund.balance <= 0 ? 0 : Math.min(100, Math.max(12, (fund.balance / 10000) * 100));

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
                {fund.balance <= 0 ? "Sin saldo · " : ""}${fund.balance.toLocaleString("es")}
              </p>
            </div>
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
      </Card>

      <FundDetailDialog open={detailOpen} onOpenChange={setDetailOpen} fund={fund} />
    </>
  );
}
