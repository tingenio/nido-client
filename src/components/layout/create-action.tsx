"use client";

import { Plus, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CreateActionProps = {
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "outline";
  children: (props: { open: boolean; onOpenChange: (open: boolean) => void }) => React.ReactNode;
  className?: string;
};

export function CreateAction({
  label,
  icon: Icon = Plus,
  variant = "default",
  children,
  className,
}: CreateActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        className={cn(
          "h-11 w-full gap-2 transition-transform duration-150 active:scale-[0.98]",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Icon className="size-4" />
        {label}
      </Button>
      {children({ open, onOpenChange: setOpen })}
    </>
  );
}
