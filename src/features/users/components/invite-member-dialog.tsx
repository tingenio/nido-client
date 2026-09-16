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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteMember } from "@/features/users/actions";
import { getIdToken } from "@/lib/auth/get-id-token";
import type { UserRole } from "@/types";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "member", label: "Miembro de la familia" },
  { value: "external", label: "Externo (ej. empleada doméstica)" },
];

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");

  async function handleSubmit() {
    if (!email.trim()) {
      toast.error("Ingresa un email");
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await inviteMember({ idToken, email: email.trim(), role });
      toast.success("Invitación creada. Comparte con esa persona el link de registro.");
      setEmail("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo invitar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar integrante</DialogTitle>
          <DialogDescription>
            Cuando esa persona cree su cuenta con este email, se unirá automáticamente a tu hogar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole((v as UserRole) ?? "member")}>
              <SelectTrigger className="w-full">
                <SelectValue />
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
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button disabled={submitting} onClick={handleSubmit}>
            Enviar invitación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
