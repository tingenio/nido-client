"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { registerPush } from "@/features/notifications/register-push";
import { useAuth } from "@/lib/auth/auth-provider";

export function EnablePushButton() {
  const { appUser } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!appUser) return;
    setBusy(true);
    try {
      const result = await registerPush(appUser.id);
      if (result === "granted") toast.success("Notificaciones activadas");
      else if (result === "denied") toast.error("Permiso de notificaciones denegado");
      else toast.error("Tu navegador no soporta notificaciones push");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo activar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" className="h-11 w-full gap-2" disabled={busy} onClick={handleClick}>
      <Bell className="size-4" />
      Activar notificaciones
    </Button>
  );
}
