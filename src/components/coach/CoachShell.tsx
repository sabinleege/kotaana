"use client";

import {
  LayoutDashboard, Users, Settings, Dumbbell, Bell, ShieldAlert,
  ClipboardList, BarChart3, CalendarDays, UserPlus, CreditCard, Link2,
} from "lucide-react";
import { FloatingNav, type NavItem } from "@/components/FloatingNav";
import { AthleteRosterList } from "./AthleteRosterList";

const NAV: NavItem[] = [
  { title: "Overview", url: "/coach", icon: LayoutDashboard, exact: true },
  { title: "Athletes", url: "/coach/athletes", icon: Users },
  { title: "Statistics", url: "/coach/statistics", icon: BarChart3 },
  { title: "Recommendations", url: "/coach/recommendations", icon: ClipboardList },
  { title: "Connect", url: "/coach/connect", icon: Link2 },
  { title: "Sessions", url: "/coach/sessions", icon: CalendarDays },
  { title: "Invites", url: "/coach/invites", icon: UserPlus },
  { title: "Injuries", url: "/coach/injuries", icon: ShieldAlert },
  { title: "Follow-ups", url: "/coach/follow-ups", icon: ClipboardList },
  { title: "Analytics", url: "/coach/analytics", icon: BarChart3 },
  { title: "Notifications", url: "/coach/notifications", icon: Bell },
  { title: "Members", url: "/coach/settings/members", icon: Users },
  { title: "Billing", url: "/coach/settings/payment", icon: CreditCard },
  { title: "Subscription", url: "/coach/subscription", icon: CreditCard },
  { title: "Athlete payments", url: "/coach/payments", icon: CreditCard },
  { title: "Settings", url: "/coach/settings", icon: Settings },
];

export function CoachShell({ coachName, children }: { coachName: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <FloatingNav
        brandName="Kotaana"
        brandSub="Coach"
        brandIcon={Dumbbell}
        items={NAV}
        userName={coachName}
        extra={
          <div>
            <div className="px-4 pb-1 text-[11px] uppercase tracking-widest text-muted-foreground">Roster</div>
            <AthleteRosterList />
          </div>
        }
      />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-20 md:px-8">{children}</main>
    </div>
  );
}
