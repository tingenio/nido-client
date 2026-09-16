"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const authInputClassName =
  "h-11 px-3.5 bg-background border-border/80 transition-all duration-200 placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-primary/20";

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  inputProps: React.ComponentProps<"input">;
};

export function AuthField({ id, label, error, inputProps }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={id}
        className={cn(authInputClassName, error && "border-destructive ring-destructive/20")}
        aria-invalid={Boolean(error)}
        {...inputProps}
      />
      {error && (
        <p className="text-destructive animate-in fade-in slide-in-from-top-1 text-xs duration-150">
          {error}
        </p>
      )}
    </div>
  );
}

type AuthPasswordFieldProps = {
  id: string;
  label: string;
  error?: string;
  inputProps: Omit<React.ComponentProps<"input">, "type">;
};

export function AuthPasswordField({ id, label, error, inputProps }: AuthPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          className={cn(
            authInputClassName,
            "pr-11",
            error && "border-destructive ring-destructive/20",
          )}
          aria-invalid={Boolean(error)}
          {...inputProps}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {error && (
        <p className="text-destructive animate-in fade-in slide-in-from-top-1 text-xs duration-150">
          {error}
        </p>
      )}
    </div>
  );
}
