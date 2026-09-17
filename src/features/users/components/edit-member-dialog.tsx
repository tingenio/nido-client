"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/ui/user-avatar";
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
import { ProfilePhotoCropStep } from "@/features/users/components/profile-photo-crop-step";
import { adminUpdateMember } from "@/features/users/actions";
import { getIdToken } from "@/lib/auth/get-id-token";
import { compressImageToDataUrl, prepareImageBlob } from "@/lib/images/compress-to-data-url";
import { ROLE_LABELS } from "@/lib/labels";
import type { AppUser, UserRole } from "@/types";

type EditMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: AppUser | null;
};

type DialogStep = "form" | "crop";

const roleOptions = (Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => ({
  value,
  label,
}));

export function EditMemberDialog({ open, onOpenChange, member }: EditMemberDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<DialogStep>("form");
  const [submitting, setSubmitting] = useState(false);
  const [preparingCrop, setPreparingCrop] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [password, setPassword] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevMemberId, setPrevMemberId] = useState<string | null>(null);

  function revokeCropSrc() {
    if (cropSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
  }

  function resetPhotoPreview(preview: string | null) {
    if (photoPreview?.startsWith("blob:") && photoPreview !== preview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(preview);
  }

  function resetDialogState() {
    revokeCropSrc();
    resetPhotoPreview(null);
    setPhotoFile(null);
    setPhotoChanged(false);
    setPassword("");
    setStep("form");
    setPreparingCrop(false);
  }

  if (open !== prevOpen || (member?.id ?? null) !== prevMemberId) {
    setPrevOpen(open);
    setPrevMemberId(member?.id ?? null);

    if (open && member) {
      setName(member.name);
      setRole(member.role);
      resetPhotoPreview(member.photoURL ?? null);
      setPhotoFile(null);
      setPhotoChanged(false);
      setPassword("");
      setStep("form");
      revokeCropSrc();
    } else if (!open) {
      resetDialogState();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("La imagen no puede superar 8 MB");
      return;
    }

    setPreparingCrop(true);
    try {
      revokeCropSrc();
      const blob = await prepareImageBlob(file);
      const nextCropSrc = URL.createObjectURL(blob);
      setCropSrc(nextCropSrc);
      setStep("crop");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la imagen");
    } finally {
      setPreparingCrop(false);
    }
  }

  function handleCropCancel() {
    revokeCropSrc();
    setStep("form");
  }

  function handleCropConfirm(file: File, previewUrl: string) {
    revokeCropSrc();
    setPhotoFile(file);
    setPhotoChanged(true);
    resetPhotoPreview(previewUrl);
    setStep("form");
  }

  async function handleSubmit() {
    if (!member) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (password.length > 0 && password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const payload: {
        idToken: string;
        memberId: string;
        name: string;
        role: UserRole;
        password?: string;
        photoURL?: string | null;
      } = {
        idToken: await getIdToken(),
        memberId: member.id,
        name: trimmedName,
        role,
      };

      if (password.length >= 6) {
        payload.password = password;
      }

      if (photoChanged) {
        payload.photoURL = photoFile ? await compressImageToDataUrl(photoFile) : null;
      }

      await adminUpdateMember(payload);
      toast.success("Integrante actualizado");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el integrante");
    } finally {
      setSubmitting(false);
    }
  }

  const isCropping = step === "crop";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCropping ? "Recortar foto" : "Editar integrante"}</DialogTitle>
          <DialogDescription>
            {isCropping
              ? "Ajusta el encuadre antes de guardar la foto de perfil."
              : "Actualiza los datos del integrante del hogar."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isCropping && cropSrc ? (
            <ProfilePhotoCropStep
              imageSrc={cropSrc}
              onConfirm={handleCropConfirm}
              onCancel={handleCropCancel}
            />
          ) : member ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  className="group relative"
                  disabled={preparingCrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UserAvatar
                    name={name || member.name}
                    photoURL={photoPreview}
                    size="lg"
                    className="size-20"
                  />
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100">
                    {preparingCrop ? (
                      <Loader2 className="size-5 animate-spin text-white" />
                    ) : (
                      <Camera className="size-5 text-white" />
                    )}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={preparingCrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {preparingCrop ? "Preparando imagen…" : "Cambiar foto"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-name">Nombre</Label>
                <Input id="member-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-email">Email</Label>
                <Input id="member-email" value={member.email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-role">Rol</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger id="member-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-password">Nueva contraseña</Label>
                <Input
                  id="member-password"
                  type="password"
                  value={password}
                  placeholder="Opcional · mínimo 6 caracteres"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </DialogBody>

        {!isCropping && member ? (
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button disabled={submitting || preparingCrop} onClick={handleSubmit}>
              Guardar cambios
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
