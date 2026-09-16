"use client";

import * as React from "react";
import { cn } from "cn";

import { Input } from "@/components/ui/input";
import {
  digitsFromCurrencyValue,
  formatCurrencyInputDigits,
  parseCurrencyInput,
} from "@/lib/format/currency";

type CurrencyInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

function CurrencyInput({
  className,
  value,
  onValueChange,
  placeholder = "0",
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    value != null && value > 0 ? formatCurrencyInputDigits(String(value)) : "",
  );
  const [prevExternalValue, setPrevExternalValue] = React.useState(value);

  if (value !== prevExternalValue) {
    setPrevExternalValue(value);
    setDisplayValue(
      value != null && value > 0 ? formatCurrencyInputDigits(digitsFromCurrencyValue(value)) : "",
    );
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");
    const formatted = formatCurrencyInputDigits(digits);
    setDisplayValue(formatted);
    onValueChange(parseCurrencyInput(digits));
  }

  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-base md:text-sm">
        $
      </span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        className={cn("pl-8 tabular-nums", className)}
      />
    </div>
  );
}

export { CurrencyInput };
