import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/fetcher";

export type CoachNote = {
  id: string;
  coach_id: string;
  athlete_id: string;
  content: string;
  visible_to_athlete: boolean;
  created_at: string;
  updated_at: string;
};

export function useCoachNotes(athleteId: string) {
  return useQuery({
    queryKey: ["coach-notes", athleteId],
    enabled: !!athleteId,
    queryFn: () => apiGet<CoachNote[]>(`/api/coach-notes?athleteId=${athleteId}`),
  });
}

export function useCreateCoachNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { athlete_id: string; content: string; visible_to_athlete: boolean }) =>
      apiPost("/api/coach-notes", input),
    onSuccess: (_d, v) => {
      toast.success("Note saved");
      qc.invalidateQueries({ queryKey: ["coach-notes", v.athlete_id] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteCoachNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/coach-notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach-notes"] }),
  });
}
