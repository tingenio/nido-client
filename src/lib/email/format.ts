import "server-only";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { formatCurrencyWithSymbol } from "@/lib/format/currency";

export function formatEmailDate(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
}

export function formatEmailMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return format(date, "MMMM yyyy", { locale: es });
}

export function formatEmailAmount(amount: number): string {
  return formatCurrencyWithSymbol(amount);
}
