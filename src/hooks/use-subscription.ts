import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/fetcher";

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: "free" | "starter" | "pro" | "team";
  status: "active" | "trialing" | "cancelled" | "past_due";
  seat_limit: number | null;
  covers_athletes: boolean;
  current_period_end: string | null;
}

export function useMySubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => apiGet<Subscription | null>("/api/subscription"),
  });
}

export function useUpsertSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Subscription>) => apiPatch("/api/subscription", patch),
    onSuccess: () => {
      toast.success("Subscription updated");
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useToggleAthleteCoverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ athleteId, covered }: { athleteId: string; covered: boolean }) =>
      apiPatch("/api/athletes/coverage", { athlete_id: athleteId, covered }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-athletes-coverage"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAthleteCoverage() {
  return useQuery({
    queryKey: ["my-athletes-coverage"],
    queryFn: () =>
      apiGet<
        {
          athlete_id: string;
          covered_by_coach: boolean;
          status: string;
          profiles: { id: string; full_name: string; email: string | null; avatar_url: string | null };
        }[]
      >("/api/athletes/coverage"),
  });
}
