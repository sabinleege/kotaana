"use client";

/**
 * Owner → Users. The account directory: who is on the platform, on what plan,
 * and the one write the owner needs — changing a role.
 */

import { useCallback, useEffect, useState } from "react";
import { Search, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/fetcher";
import { PageHead, Panel, RoleBadge, Empty, Loading, ErrorNote } from "@/components/owner/ui";

type Row = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "coach" | "admin";
  createdAt: string;
  plan: string;
  planStatus: string;
  aiCalls: number;
};

type Resp = { users: Row[]; total: number; page: number; pages: number };

const FILTERS = [
  { id: "", label: "All" },
  { id: "user", label: "Athletes" },
  { id: "coach", label: "Coaches" },
  { id: "admin", label: "Owners" },
];

export default function OwnerUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (role) params.set("role", role);
      if (q.trim()) params.set("q", q.trim());
      const data = await apiGet<Resp>(`/api/owner/users?${params}`);
      setRows(data.users);
      setTotal(data.total);
      setPages(data.pages);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [page, role, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function changeRole(userId: string, next: Row["role"]) {
    setBusy(userId);
    try {
      await apiPatch("/api/owner/users", { userId, role: next });
      toast.success("Role updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change role");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHead
        title="Users"
        subtitle={`${total} account${total === 1 ? "" : "s"} on the platform`}
      />

      <Panel
        title="Directory"
        description="Search by name or email. Changing a role moves that person to a different dashboard."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Search…"
                className="rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setRole(f.id);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    role === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {err && <ErrorNote message={err} />}
        {loading && !err && <Loading />}

        {!loading && !err && rows.length === 0 && <Empty>No accounts match that search.</Empty>}

        {!loading && !err && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Person</th>
                  <th className="pb-2 pr-3 font-medium">Role</th>
                  <th className="pb-2 pr-3 font-medium">Plan</th>
                  <th className="pb-2 pr-3 text-right font-medium">AI calls</th>
                  <th className="pb-2 pr-3 font-medium">Joined</th>
                  <th className="pb-2 font-medium">Change role</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-3">
                      <div className="font-medium">{u.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 pr-3">
                      <span className="capitalize">{u.plan}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({u.planStatus})</span>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">{u.aiCalls}</td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <select
                        value={u.role}
                        disabled={busy === u.id}
                        onChange={(e) => changeRole(u.id, e.target.value as Row["role"])}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary disabled:opacity-50"
                      >
                        <option value="user">Athlete</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Owner</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </Panel>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <UsersIcon className="h-3.5 w-3.5" />
        Promoting someone to Owner gives them full platform metrics. You cannot demote yourself
        while you are the only owner.
      </p>
    </div>
  );
}
