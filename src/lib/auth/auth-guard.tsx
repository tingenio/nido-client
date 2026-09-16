"use client";

import { signOut } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";

import { useAuth } from "./auth-provider";

/**
 * Protección de rutas del lado del cliente: redirige a /login si no hay
 * sesión. La seguridad real de los datos la garantizan las Firestore
 * Security Rules; esto solo evita mostrar UI protegida antes de tiempo.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [loading, firebaseUser, router]);

  if (loading) {
    return (
      <div className="app-gradient-bg flex min-h-dvh flex-col items-center justify-center gap-4">
        <Logo variant="mark" size="lg" />
        <Loader2 className="text-primary size-6 animate-spin" />
        <p className="text-muted-foreground text-sm">Cargando tu hogar…</p>
      </div>
    );
  }

  if (!firebaseUser) return null;

  // Sesión de Firebase Auth válida pero sin perfil en `users/{uid}` —
  // típicamente porque el Admin SDK no estaba configurado al registrarse.
  if (!appUser) return <ProfileMissing />;

  return <>{children}</>;
}

function ProfileMissing() {
  return (
    <div className="app-gradient-bg flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <Logo variant="mark" size="lg" />
      <p className="text-sm font-medium">Sin acceso a la aplicación</p>
      <p className="text-muted-foreground max-w-sm text-sm">
        Tu cuenta no tiene acceso. Contacta al administrador de tu hogar.
      </p>
      <Button variant="outline" onClick={() => signOut(auth)}>
        Cerrar sesión
      </Button>
    </div>
  );
}
