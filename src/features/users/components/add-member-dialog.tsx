"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMember } from "@/features/users/actions";
import { getIdToken } from "@/lib/auth/get-id-token";
import { ROLE_LABELS } from "@/lib/labels";
import type { UserRole } from "@/types";

const roleOptions = (Object.entries(ROLE_LABELS) as [UserRole, string][]).map(
  ([value, label]) => ({ value, label }),
);

type AddMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [password, setPassword] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setRole("member");
    setPassword("");
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Ingresa un nombre");
      return;
    }
    if (!email.trim()) {
      toast.error("Ingresa un email");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await createMember({
        idToken,
        name: name.trim(),
        email: email.trim(),
        role,
        password,
      });
      toast.success("Integrante creado. Ya puede iniciar sesión con esas credenciales.");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el integrante");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar integrante</DialogTitle>
          <DialogDescription>
            Crea una cuenta con correo, nombre y rol. La persona podrá iniciar sesión de inmediato.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="member-name">Nombre</Label>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{ROLE_LABELS[role]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-password">Contraseña inicial</Label>
              <Input
                id="member-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button disabled={submitting} onClick={handleSubmit}>
            Crear integrante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
