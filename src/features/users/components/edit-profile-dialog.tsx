"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { updateProfile } from "@/features/users/actions";
import { getIdToken } from "@/lib/auth/get-id-token";
import { useAuth } from "@/lib/auth/auth-provider";
import { storage } from "@/lib/firebase/client";
import { ROLE_LABELS } from "@/lib/labels";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { appUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (open && appUser) {
      setName(appUser.name);
      setPhotoPreview(appUser.photoURL ?? null);
      setPhotoFile(null);
    }
  }, [open, appUser]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5 MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const storageRef = ref(storage, `users/${appUser.id}/avatar/${Date.now()}.${ext}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      const idToken = await getIdToken();
      await updateProfile({ idToken, name: trimmedName, photoURL });
      toast.success("Perfil actualizado");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el perfil");
    } finally {
      setSubmitting(false);
    }
  }

  const initials = name.slice(0, 2).toUpperCase() || "??";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Actualiza tu nombre y foto de perfil.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                className="group relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="size-20">
                  {photoPreview && <AvatarImage src={photoPreview} alt={name} />}
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-5 text-white" />
                </span>
              </button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar foto
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button disabled={submitting} onClick={handleSubmit}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
