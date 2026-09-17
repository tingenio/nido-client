"use client";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { useAuth } from "@/lib/auth/auth-provider";
import { AuthGuard } from "@/lib/auth/auth-guard";

function AppShell({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth();
  if (!appUser) return null;

  return (
    <div className="app-gradient-bg flex min-h-dvh flex-col">
      <AppHeader />
      <main
        className="mx-auto w-full max-w-md flex-1 px-4 py-4"
        style={{ paddingBottom: "var(--app-main-padding-bottom)" }}
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav role={appUser.role} />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
