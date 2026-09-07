import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/fetcher";

export type AthleteSummary = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  age: number | null;
  weight: number | null;
  target_weight: number | null;
  fitness_score: number | null;
  recovery_score: number | null;
  consistency_score: number | null;
  onboarding_completed: boolean;
  relation_status: string;
};

export function useMyAthletes() {
  return useQuery({
    queryKey: ["my-athletes"],
    queryFn: () => apiGet<AthleteSummary[]>("/api/athletes"),
  });
}

export function useAthleteDetail(athleteId: string) {
  return useQuery({
    queryKey: ["athlete", athleteId],
    enabled: !!athleteId,
    queryFn: () =>
      apiGet<{
        profile: Record<string, unknown> | null;
        weights: unknown[];
        workouts: unknown[];
        activity: unknown[];
      }>(`/api/athletes/${athleteId}`),
  });
}

export function useCoachProfile() {
  return useQuery({
    queryKey: ["coach-profile"],
    queryFn: () =>
      apiGet<{ id: string; email: string; role: string; full_name: string }>("/api/me"),
  });
}
