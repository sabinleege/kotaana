import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch } from "@/lib/fetcher";

export interface Session {
  id: string;
  coach_id: string;
  title: string;
  athlete_ids: string[];
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  session_type: "training" | "court" | "assessment" | "recovery" | "team";
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  notes: string | null;
  created_at: string;
}

export function useSessions() {
  return useQuery({
    queryKey: ["coach-sessions"],
    queryFn: () => apiGet<Session[]>("/api/sessions"),
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Session>) => apiPost("/api/sessions", input),
    onSuccess: () => {
      toast.success("Session created");
      qc.invalidateQueries({ queryKey: ["coach-sessions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Session> & { id: string }) =>
      apiPatch(`/api/sessions/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach-sessions"] }),
    onError: (e: any) => toast.error(e.message),
  });
}
