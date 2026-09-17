"use client";

import { Bell, ListChecks, MoreHorizontal, StickyNote, User, UtensilsCrossed, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const primaryItems = [
  { href: "/tasks", label: "Tareas", icon: ListChecks, roles: ["admin", "member", "external"] },
  { href: "/lunch-menu", label: "Menú", icon: UtensilsCrossed, roles: ["admin", "member", "external"] },
  { href: "/reminders", label: "Recordatorios", icon: Bell, roles: ["admin", "member"] },
] as const;

const overflowItems = [
  { href: "/expenses", label: "Gastos", icon: Wallet, roles: ["admin", "member"] },
  { href: "/notes", label: "Notas", icon: StickyNote, roles: ["admin", "member"] },
  { href: "/profile", label: "Perfil", icon: User, roles: ["admin", "member", "external"] },
] as const;

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const visiblePrimaryItems = primaryItems.filter((item) =>
    (item.roles as readonly UserRole[]).includes(role),
  );
  const visibleOverflowItems = overflowItems.filter((item) =>
    (item.roles as readonly UserRole[]).includes(role),
  );

  const isMoreActive = visibleOverflowItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <ul
        className="bg-background/95 supports-backdrop-filter:bg-background/80 pointer-events-auto mx-auto grid max-w-md rounded-2xl border shadow-[var(--shadow-card)] backdrop-blur"
        style={{ gridTemplateColumns: `repeat(${visiblePrimaryItems.length + 1}, minmax(0, 1fr))` }}
      >
        {visiblePrimaryItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-2 py-2.5 text-xs transition-all duration-200",
                  active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    className="bg-primary/10 absolute inset-x-2 inset-y-1.5 rounded-xl transition-all duration-200"
                    aria-hidden="true"
                  />
                )}
                <Icon className={cn("relative size-5 transition-transform duration-200", active && "scale-110")} />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex w-full flex-col items-center gap-1 px-2 py-2.5 text-xs transition-all duration-200",
              isMoreActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isMoreActive && (
              <span
                className="bg-primary/10 absolute inset-x-2 inset-y-1.5 rounded-xl transition-all duration-200"
                aria-hidden="true"
              />
            )}
            <MoreHorizontal
              className={cn("relative size-5 transition-transform duration-200", isMoreActive && "scale-110")}
            />
            <span className="relative">Más</span>
          </button>
        </li>
      </ul>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="pointer-events-auto mx-auto max-w-md rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Más</SheetTitle>
          </SheetHeader>
          <ul className="space-y-1 px-4 pb-4">
            {visibleOverflowItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4.5" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
