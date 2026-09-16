"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthField, AuthPasswordField } from "@/features/users/components/auth-field";
import { auth } from "@/lib/firebase/client";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function AuthForm() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Algo salió mal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-card)] [--card-spacing:--spacing(6)]">
      <CardHeader className="items-center gap-3 pb-2 text-center">
        <Logo size="lg" className="justify-center" />
        <p className="text-muted-foreground mx-auto max-w-[280px] text-sm leading-relaxed">
          Inicia sesión con las credenciales que te dio el administrador.
        </p>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
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
                autoComplete: "current-password",
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
            {submitting ? "Un momento…" : "Ingresar"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
