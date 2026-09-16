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
import { ProfilePhotoCropStep } from "@/features/users/components/profile-photo-crop-step";
import { updateProfile } from "@/features/users/actions";
import { getIdToken } from "@/lib/auth/get-id-token";
import { useAuth } from "@/lib/auth/auth-provider";
import { compressImageToDataUrl, prepareImageBlob } from "@/lib/images/compress-to-data-url";
import { ROLE_LABELS } from "@/lib/labels";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DialogStep = "form" | "crop";

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { appUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<DialogStep>("form");
  const [submitting, setSubmitting] = useState(false);
  const [preparingCrop, setPreparingCrop] = useState(false);
  const [name, setName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

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
    setStep("form");
    setPreparingCrop(false);
  }

  if (open !== prevOpen) {
    setPrevOpen(open);

    if (open && appUser) {
      setName(appUser.name);
      resetPhotoPreview(appUser.photoURL ?? null);
      setPhotoFile(null);
      setStep("form");
      revokeCropSrc();
    } else if (!open) {
      resetDialogState();
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
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
    resetPhotoPreview(previewUrl);
    setStep("form");
  }

  async function handleSubmit() {
    if (!appUser) return;
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      let photoURL: string | undefined = appUser.photoURL;

      if (photoFile) {
        photoURL = await compressImageToDataUrl(photoFile);
      }

      const idToken = await getIdToken();
      await updateProfile({ idToken, name: trimmedName, photoURL });
      toast.success("Perfil actualizado");
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el perfil");
    } finally {
      setSubmitting(false);
    }
  }

  const isCropping = step === "crop";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCropping ? "Recortar foto" : "Editar perfil"}</DialogTitle>
          <DialogDescription>
            {isCropping
              ? "Ajusta el encuadre antes de guardar tu foto de perfil."
              : "Actualiza tu nombre y foto de perfil."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isCropping && cropSrc ? (
            <ProfilePhotoCropStep
              imageSrc={cropSrc}
              onConfirm={handleCropConfirm}
              onCancel={handleCropCancel}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  className="group relative"
                  disabled={preparingCrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UserAvatar
                    name={name || appUser?.name || "?"}
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
                <Label htmlFor="profile-name">Nombre</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" value={appUser?.email ?? ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-role">Rol</Label>
                <Input
                  id="profile-role"
                  value={appUser ? ROLE_LABELS[appUser.role] : ""}
                  disabled
                />
              </div>
            </div>
          )}
        </DialogBody>

        {!isCropping && (
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button disabled={submitting || preparingCrop} onClick={handleSubmit}>
              Guardar cambios
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
