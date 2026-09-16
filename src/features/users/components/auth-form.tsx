"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthField, AuthPasswordField } from "@/features/users/components/auth-field";
import { provisionUser } from "@/features/users/actions";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

type AuthFormValues = {
  email: string;
  password: string;
  name?: string;
};

function createAuthSchema(mode: Mode) {
  const base = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    name: z.string(),
  });

  if (mode === "login") {
    return base.omit({ name: true }).extend({ name: z.string().optional() });
  }

  return base.extend({ name: z.string().min(2, "Ingresa tu nombre") });
}

const subtitles: Record<Mode, string> = {
  login: "Inicia sesión para ver tu hogar",
  register:
    "Crea tu cuenta. Si tienes una invitación pendiente, te unirás a ese hogar automáticamente.",
};

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(createAuthSchema(mode)),
    defaultValues: { email: "", password: "", name: "" },
  });

  async function onSubmit(values: AuthFormValues) {
    setSubmitting(true);
    try {
      const credential =
        mode === "login"
          ? await signInWithEmailAndPassword(auth, values.email, values.password)
          : await createUserWithEmailAndPassword(auth, values.email, values.password);

      const idToken = await credential.user.getIdToken();
      await provisionUser({
        idToken,
        name: values.name || credential.user.email!.split("@")[0],
      });

      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Algo salió mal");
    } finally {
      setSubmitting(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-card)] [--card-spacing:--spacing(6)]">
      <CardHeader className="items-center gap-3 pb-2 text-center">
        <Logo size="lg" className="justify-center" />
        <p
          key={mode}
          className="auth-text-enter text-muted-foreground mx-auto max-w-[280px] text-sm leading-relaxed"
        >
          {subtitles[mode]}
        </p>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="h-11 w-full p-1 transition-all duration-200">
              <TabsTrigger className="h-full flex-1 rounded-lg" value="login">
                Ingresar
              </TabsTrigger>
              <TabsTrigger className="h-full flex-1 rounded-lg" value="register">
                Crear cuenta
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <div
              className={cn(
                "auth-field-expand",
                isRegister ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <AuthField
                  id="name"
                  label="Nombre"
                  error={form.formState.errors.name?.message}
                  inputProps={{
                    placeholder: "Tu nombre",
                    ...form.register("name"),
                  }}
                />
              </div>
            </div>

            <AuthField
              id="email"
              label="Email"
              error={form.formState.errors.email?.message}
              inputProps={{
                type: "email",
                placeholder: "tu@email.com",
                autoComplete: "email",
                ...form.register("email"),
              }}
            />

            <AuthPasswordField
              id="password"
              label="Contraseña"
              error={form.formState.errors.password?.message}
              inputProps={{
                autoComplete: isRegister ? "new-password" : "current-password",
                ...form.register("password"),
              }}
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full gap-2 transition-opacity duration-200 disabled:opacity-70"
            disabled={submitting}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Un momento…" : isRegister ? "Crear cuenta" : "Ingresar"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
