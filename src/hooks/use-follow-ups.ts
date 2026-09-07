import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch } from "@/lib/fetcher";

export type FollowUpStatus = "pending" | "done" | "snoozed";
export type FollowUp = {
  id: string;
  coach_id: string;
  athlete_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "normal" | "high";
  status: FollowUpStatus;
  created_at: string;
  updated_at: string;
  athlete?: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

export function useFollowUps(opts?: { athleteId?: string; status?: FollowUpStatus }) {
  return useQuery({
    queryKey: ["follow-ups", opts?.athleteId ?? "all", opts?.status ?? "any"],
    queryFn: () => {
      const p = new URLSearchParams();
      if (opts?.athleteId) p.set("athleteId", opts.athleteId);
      if (opts?.status) p.set("status", opts.status);
      const qs = p.toString();
      return apiGet<FollowUp[]>(`/api/follow-ups${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useCreateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<FollowUp, "id" | "coach_id" | "created_at" | "updated_at" | "athlete" | "status"> & {
        status?: FollowUpStatus;
      },
    ) => apiPost("/api/follow-ups", input),
    onSuccess: () => {
      toast.success("Follow-up added");
      qc.invalidateQueries({ queryKey: ["follow-ups"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<FollowUp, "athlete" | "id">> }) =>
      apiPatch(`/api/follow-ups/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow-ups"] }),
    onError: (e: any) => toast.error(e.message),
  });
}
