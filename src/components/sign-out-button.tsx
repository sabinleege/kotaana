"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent/10"
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}
