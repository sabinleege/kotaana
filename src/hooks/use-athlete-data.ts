import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/fetcher";

export type Profile = Record<string, any> | null;
export type WeightRow = { id: string; week_label: string; weight: number; recorded_at: string };
export type ActivityRow = { id: string; day: string; date: string; calories: number };
export type MealLog = { id: string; date: string; meals: any[]; total_calories: number; total_protein: number };
export type WorkoutRow = { id: string; date: string; completion_rate: number; notes: string | null };

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: () => apiGet<Profile>("/api/profile") });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => apiPatch<Profile>("/api/profile", patch),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useWeightHistory() {
  return useQuery({ queryKey: ["weight"], queryFn: () => apiGet<WeightRow[]>("/api/weight") });
}

export function useLogWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { week_label: string; weight: number }) => apiPost("/api/weight", input),
    onSuccess: () => {
      toast.success("Weight logged");
      qc.invalidateQueries({ queryKey: ["weight"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useActivity() {
  return useQuery({ queryKey: ["activity"], queryFn: () => apiGet<ActivityRow[]>("/api/activity") });
}

export function useWorkoutLogs() {
  return useQuery({ queryKey: ["workout-logs"], queryFn: () => apiGet<WorkoutRow[]>("/api/workout-logs") });
}

export function useMealLog(date: string) {
  return useQuery({
    queryKey: ["meal-log", date],
    queryFn: () => apiGet<MealLog | null>(`/api/meal-logs?date=${date}`),
  });
}

export function useSaveMealLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; meals: any[]; total_calories: number; total_protein: number }) =>
      apiPost("/api/meal-logs", input),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["meal-log", v.date] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Injuries (athlete self-service; shared with the coach view) ──
export type MyInjury = {
  id: string;
  body_part: string;
  injury_type: string;
  severity: number;
  status: "active" | "recovering" | "resolved";
  date_reported: string;
  expected_return: string | null;
  notes: string | null;
};

export function useMyInjuries() {
  return useQuery({ queryKey: ["my-injuries"], queryFn: () => apiGet<MyInjury[]>("/api/injuries") });
}

export function useLogInjury() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<MyInjury>) => apiPost("/api/injuries", input),
    onSuccess: () => {
      toast.success("Injury logged");
      qc.invalidateQueries({ queryKey: ["my-injuries"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateMyInjury() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<MyInjury> }) => apiPatch(`/api/injuries/${id}`, patch),
    onSuccess: () => {
      toast.success("Injury updated");
      qc.invalidateQueries({ queryKey: ["my-injuries"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteInjury() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/injuries/${id}`),
    onSuccess: () => {
      toast.success("Injury removed");
      qc.invalidateQueries({ queryKey: ["my-injuries"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Daily readiness check-in ──
export type Checkin = {
  id: string; date: string; energy: number; soreness: number; mood: number;
  sleep_hours: number | null; feeling: "great" | "ok" | "off" | "sick";
  symptoms: string | null; notes: string | null; readiness: number;
};

export function useTodayCheckin() {
  return useQuery({ queryKey: ["checkin-today"], queryFn: () => apiGet<Checkin | null>("/api/checkins") });
}

export function useSaveCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Checkin>) => apiPost("/api/checkins", input),
    onSuccess: () => {
      toast.success("Thanks — today's plan will adapt to how you feel");
      qc.invalidateQueries({ queryKey: ["checkin-today"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Runs / GPS activity ──
export type Run = {
  id: string; date: string; activity_type: string; distance_km: number;
  duration_sec: number; calories: number; avg_pace_sec: number | null; source: string; created_at: string;
};

export function useRuns() {
  return useQuery({ queryKey: ["runs"], queryFn: () => apiGet<Run[]>("/api/runs") });
}

export function useSaveRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Run> & { path?: any }) => apiPost("/api/runs", input),
    onSuccess: () => {
      toast.success("Activity saved");
      qc.invalidateQueries({ queryKey: ["runs"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}
