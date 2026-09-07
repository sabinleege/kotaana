import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
  { href: "/admin", label: "Metrics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/ai-usage", label: "AI usage" },
  { href: "/admin/system", label: "System" },
  { href: "/admin/payments", label: "MoMo payments" },
  { href: "/admin/settings", label: "Platform MoMo" },
];

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/owner-auth?callbackUrl=/admin");
  if (session.user.role !== "admin") {
    const home = session.user.role === "coach" ? "/coach" : "/app";
    redirect(home);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="font-semibold tracking-tight">
            Kotaana <span className="font-normal text-muted-foreground">Owner</span>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-3 text-sm text-muted-foreground">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-foreground">
                {n.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
