"use client";

import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  TrendingUp,
  Activity,
  Settings,
  Navigation,
  HeartPulse,
  Camera,
  Bell,
  Target,
  ListChecks,
  FileText,
  User,
  CreditCard,
} from "lucide-react";
import { FloatingNav, type NavItem } from "@/components/FloatingNav";
import { AICoachChat } from "@/components/athlete/AICoachChat";

/** Athlete nav — Exercises removed (AI Workout only); Injuries live under Health; Notifications in main nav. */
const NAV: NavItem[] = [
  { title: "Home", url: "/app", icon: LayoutDashboard, exact: true },
  { title: "Workout", url: "/app/workout", icon: Dumbbell },
  { title: "Nutrition", url: "/app/nutrition", icon: Apple },
  { title: "Track", url: "/app/track", icon: Navigation },
  { title: "Progress", url: "/app/progress", icon: TrendingUp },
  { title: "Photos", url: "/app/photos", icon: Camera },
  { title: "Health", url: "/app/health", icon: HeartPulse },
  { title: "Goals", url: "/app/goals", icon: Target },
  { title: "Exercises", url: "/app/exercises", icon: ListChecks },
  { title: "Medical", url: "/app/medical", icon: FileText },
  { title: "Notifications", url: "/app/notifications", icon: Bell },
  { title: "Profile", url: "/app/profile", icon: User },
  { title: "Subscription", url: "/app/subscription", icon: CreditCard },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AthleteShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <FloatingNav
        brandName="Kotaana"
        brandSub="Athlete"
        brandIcon={Activity}
        items={NAV}
        userName={name}
      />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-20 sm:px-6">{children}</main>
      <AICoachChat />
    </div>
  );
}
