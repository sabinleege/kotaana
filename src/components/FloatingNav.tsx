"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { title: string; url: string; icon: LucideIcon; exact?: boolean };

export function FloatingNav({
  brandName,
  brandSub,
  brandIcon: BrandIcon,
  items,
  userName,
  extra,
}: {
  brandName: string;
  brandSub?: string;
  brandIcon: LucideIcon;
  items: NavItem[];
  userName: string;
  extra?: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (url: string, exact?: boolean) => (exact ? path === url : path.startsWith(url));
  const initials = (userName || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hovering menu button — always visible, every screen size */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={cn(
          "fixed left-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-2xl",
          "border border-border/60 bg-card/70 text-foreground shadow-lg backdrop-blur-xl",
          "transition hover:scale-105 hover:border-primary/40 hover:text-primary",
          open && "pointer-events-none opacity-0",
        )}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-xs flex-col",
          "border-r border-border/60 bg-sidebar/95 backdrop-blur-2xl shadow-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--glow-primary)]">
            <BrandIcon className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold">{brandName}</div>
            {brandSub && <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{brandSub}</div>}
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {items.map((item) => {
            const active = isActive(item.url, item.exact);
            return (
              <Link
                key={item.url}
                href={item.url}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-[image:var(--gradient-primary)] font-medium text-primary-foreground shadow-[var(--glow-primary)]"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {extra && <div className="mt-3 overflow-y-auto border-t border-border/50 pt-2">{extra}</div>}

        <div className="mt-auto flex items-center gap-3 border-t border-border/50 px-4 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{userName}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>
    </>
  );
}
