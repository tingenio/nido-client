"use client";

import { Bell, ListChecks, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const items = [
  { href: "/tasks", label: "Tareas", icon: ListChecks, roles: ["admin", "member", "external"] },
  { href: "/reminders", label: "Recordatorios", icon: Bell, roles: ["admin", "member"] },
  { href: "/expenses", label: "Gastos", icon: Wallet, roles: ["admin", "member"] },
  { href: "/profile", label: "Perfil", icon: User, roles: ["admin", "member", "external"] },
] as const;

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visibleItems = items.filter((item) => (item.roles as readonly UserRole[]).includes(role));

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <ul
        className="bg-background/95 supports-backdrop-filter:bg-background/80 pointer-events-auto mx-auto grid max-w-md rounded-2xl border shadow-[var(--shadow-card)] backdrop-blur"
        style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
      >
        {visibleItems.map(({ href, label, icon: Icon }) => {
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
      </ul>
    </nav>
  );
}
