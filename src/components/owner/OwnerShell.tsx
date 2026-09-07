"use client";

import {
  Gauge,
  Users,
  Sparkles,
  ServerCog,
  Wallet,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { FloatingNav, type NavItem } from "@/components/FloatingNav";

/**
 * Owner shell — the third dashboard.
 *
 * Mirrors AthleteShell / CoachShell so all three areas are structurally the
 * same thing: one shell component owning one nav, badged with its role.
 */
const NAV: NavItem[] = [
  { title: "Metrics", url: "/admin", icon: Gauge, exact: true },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "AI usage", url: "/admin/ai-usage", icon: Sparkles },
  { title: "System", url: "/admin/system", icon: ServerCog },
  { title: "MoMo payments", url: "/admin/payments", icon: Wallet },
  { title: "Platform MoMo", url: "/admin/settings", icon: Smartphone },
];

export function OwnerShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <FloatingNav
        brandName="Kotaana"
        brandSub="Owner"
        brandIcon={ShieldCheck}
        items={NAV}
        userName={name}
      />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-20 md:px-8">{children}</main>
    </div>
  );
}
