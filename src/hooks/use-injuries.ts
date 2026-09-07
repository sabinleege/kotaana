import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch } from "@/lib/fetcher";

export type InjuryStatus = "active" | "recovering" | "resolved";
export type Injury = {
  id: string;
  athlete_id: string;
  body_part: string;
  injury_type: string;
  severity: number;
  status: InjuryStatus;
  date_reported: string;
  expected_return: string | null;
  notes: string | null;
  recovery_timeline: any;
  created_at: string;
  updated_at: string;
  athlete?: { id: string; full_name: string | null; avatar_url: string | null; email: string | null } | null;
};

export function useInjuries(opts?: { athleteId?: string; activeOnly?: boolean }) {
  return useQuery({
    queryKey: ["injuries", opts?.athleteId ?? "all", opts?.activeOnly ?? false],
    queryFn: () => {
      const p = new URLSearchParams();
      if (opts?.athleteId) p.set("athleteId", opts.athleteId);
      if (opts?.activeOnly) p.set("activeOnly", "true");
      const qs = p.toString();
      return apiGet<Injury[]>(`/api/injuries${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useCreateInjury() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Injury, "id" | "created_at" | "updated_at" | "athlete">) =>
      apiPost("/api/injuries", input),
    onSuccess: () => {
      toast.success("Injury logged");
      qc.invalidateQueries({ queryKey: ["injuries"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateInjury() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Injury, "athlete" | "id">> }) =>
      apiPatch(`/api/injuries/${id}`, patch),
    onSuccess: () => {
      toast.success("Injury updated");
      qc.invalidateQueries({ queryKey: ["injuries"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}
