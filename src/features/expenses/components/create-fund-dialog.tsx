"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFund } from "@/features/expenses/actions";
import { getIdToken } from "@/lib/auth/get-id-token";

type CreateFundDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateFundDialog({ open, onOpenChange }: CreateFundDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState(0);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Ponle un nombre al fondo");
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await createFund({ idToken, name: name.trim(), initialBalance });
      toast.success("Fondo creado");
      setName("");
      setInitialBalance(0);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el fondo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo fondo</DialogTitle>
          <DialogDescription>Ej: Ocio, Ahorro, Mercado.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="fund-name">Nombre</Label>
            <Input id="fund-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fund-balance">Saldo inicial</Label>
            <Input
              id="fund-balance"
              type="number"
              min={0}
              value={initialBalance}
              onChange={(e) => setInitialBalance(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button disabled={submitting} onClick={handleSubmit}>
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
