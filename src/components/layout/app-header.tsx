"use client";

import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { auth } from "@/lib/firebase/client";

const routeTitles: Record<string, string> = {
  "/tasks": "Tareas",
  "/reminders": "Recordatorios",
  "/expenses": "Gastos",
  "/profile": "Perfil",
};

export function AppHeader() {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "Nido";
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut(auth);
      setLogoutOpen(false);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header
        className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky inset-x-0 top-0 z-40 border-b backdrop-blur"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-3 items-center px-4 pb-3">
          <div className="flex justify-start">
            <Logo variant="mark" size="sm" />
          </div>
          <h1
            key={pathname}
            className="text-center text-sm font-semibold transition-opacity duration-200"
          >
            {title}
          </h1>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLogoutOpen(true)}
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="¿Cerrar sesión?"
        description="Tendrás que volver a ingresar para acceder a tu hogar."
        confirmLabel="Cerrar sesión"
        variant="destructive"
        loading={loggingOut}
        onConfirm={handleLogout}
      />
    </>
  );
}
