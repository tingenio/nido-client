import { formatCurrencyWithSymbol } from "@/lib/format/currency";
import type { Fund } from "@/types";

export type FundProgress = {
  hasTarget: boolean;
  percent: number;
  label?: string;
  targetReached: boolean;
};

export function getFundProgress(fund: Fund): FundProgress {
  const targetAmount = fund.targetAmount;

  if (targetAmount == null || targetAmount <= 0) {
    return { hasTarget: false, percent: 0, targetReached: false };
  }

  const percent = Math.min(100, Math.max(0, (fund.balance / targetAmount) * 100));
  const targetReached = fund.balance >= targetAmount;

  return {
    hasTarget: true,
    percent,
    label: `${formatCurrencyWithSymbol(fund.balance)} / ${formatCurrencyWithSymbol(targetAmount)}`,
    targetReached,
  };
}
