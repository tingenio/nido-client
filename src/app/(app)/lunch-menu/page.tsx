"use client";

import { PageHeader } from "@/components/layout/page-header";
import { LunchMenuList } from "@/features/lunch-menu/components/lunch-menu-list";
import { useLunchMenu } from "@/features/lunch-menu/hooks/use-lunch-menu";
import { useAuth } from "@/lib/auth/auth-provider";

export default function LunchMenuPage() {
  const { appUser } = useAuth();
  const { menu, loading } = useLunchMenu();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menú de almuerzos"
        description="Qué se cocina cada día, siempre visible para todos."
      />

      <LunchMenuList menu={menu} loading={loading} canEdit={appUser?.role !== "external"} />
    </div>
  );
}
