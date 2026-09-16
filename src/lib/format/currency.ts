const CURRENCY_LOCALE = "es";

export function formatCurrency(value: number): string {
  return value.toLocaleString(CURRENCY_LOCALE, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

export function formatCurrencyWithSymbol(value: number): string {
  return `$${formatCurrency(value)}`;
}

export function parseCurrencyInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

export function formatCurrencyInputDigits(digits: string): string {
  if (!digits) return "";
  const value = Number(digits);
  if (!Number.isFinite(value)) return "";
  return formatCurrency(value);
}

export function digitsFromCurrencyValue(value: number | null | undefined): string {
  if (value == null || value <= 0) return "";
  return String(Math.trunc(value));
}
