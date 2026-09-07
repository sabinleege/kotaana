"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

/**
 * Explains why someone landed back on a sign-in page.
 *
 * The common case is WrongPortal: browsers scope cookies by host and ignore the
 * port, so a session started on the athlete portal is also sent to the coach and
 * owner portals. Rather than bounce the person around, each portal shows this
 * and offers the one action that helps — sign out and use the right account.
 *
 * Reads the query string directly instead of useSearchParams() so the page can
 * stay statically prerendered without a Suspense boundary.
 */
export function PortalNotice({ portalLabel }: { portalLabel: string }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(new URLSearchParams(window.location.search).get("error"));
  }, []);

  if (error !== "WrongPortal") return null;

  return (
    <div className="mt-4 rounded-xl border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-4 py-3 text-sm">
      <p>
        You’re signed in with an account that isn’t a {portalLabel.toLowerCase()} account. This
        portal only serves {portalLabel.toLowerCase()}s.
      </p>
      <button
        type="button"
        onClick={() => signOut({ redirect: false }).then(() => window.location.replace(window.location.pathname))}
        className="mt-2 font-medium underline underline-offset-2"
      >
        Sign out and use a different account
      </button>
    </div>
  );
}
