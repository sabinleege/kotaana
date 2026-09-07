import { useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShieldAlert } from "lucide-react";
import { useInjuries, type Injury, type InjuryStatus, useUpdateInjury } from "@/hooks/use-injuries";
import { InjuryDetailModal } from "./InjuryDetailModal";

const severityTone: Record<number, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-accent/15 text-accent",
  3: "bg-accent/25 text-accent",
  4: "bg-destructive/15 text-destructive",
  5: "bg-destructive/30 text-destructive",
};
const statusTone: Record<InjuryStatus, string> = {
  active: "bg-destructive/15 text-destructive",
  recovering: "bg-accent/15 text-accent",
  resolved: "bg-primary/15 text-primary",
};

export function InjuryTable() {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(true);
  const [open, setOpen] = useState<Injury | null>(null);
  const { data: injuries = [], isLoading } = useInjuries({ activeOnly });
  const update = useUpdateInjury();

  const rows = useMemo(() => {
    return injuries.filter((i) => {
      const matchQ = q
        ? (i.athlete?.full_name || "").toLowerCase().includes(q.toLowerCase()) ||
          i.body_part.toLowerCase().includes(q.toLowerCase()) ||
          i.injury_type.toLowerCase().includes(q.toLowerCase())
        : true;
      const matchSev = sev === "all" ? true : Number(sev) === i.severity;
      return matchQ && matchSev;
    });
  }, [injuries, q, sev]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search athlete or injury…" className="pl-9" />
        </div>
        <Select value={sev} onValueChange={setSev}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>Severity {n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={activeOnly ? "default" : "outline"} onClick={() => setActiveOnly((v) => !v)}>
          <ShieldAlert className="mr-2 h-4 w-4" />
          {activeOnly ? "Active only" : "All injuries"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Athlete</TableHead>
              <TableHead>Body part</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Return</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No injuries match.</TableCell></TableRow>
            ) : rows.map((i) => {
              const initials = (i.athlete?.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
              return (
                <TableRow key={i.id} className="cursor-pointer" onClick={() => setOpen(i)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={i.athlete?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{i.athlete?.full_name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{i.body_part}</TableCell>
                  <TableCell>{i.injury_type}</TableCell>
                  <TableCell><Badge className={severityTone[i.severity]} variant="secondary">{i.severity}</Badge></TableCell>
                  <TableCell>{new Date(i.date_reported).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className={statusTone[i.status]} variant="secondary">{i.status}</Badge></TableCell>
                  <TableCell>{i.expected_return ? new Date(i.expected_return).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={i.status}
                      onValueChange={(v) => update.mutate({ id: i.id, patch: { status: v as InjuryStatus } })}
                    >
                      <SelectTrigger className="ml-auto h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="recovering">Recovering</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <InjuryDetailModal injury={open} onClose={() => setOpen(null)} />
    </div>
  );
}
