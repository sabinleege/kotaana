import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch } from "@/lib/fetcher";

export interface CoachInvite {
  id: string;
  coach_id: string;
  email: string | null;
  invite_code: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export function useMyInvites() {
  return useQuery({
    queryKey: ["coach-invites"],
    queryFn: () => apiGet<CoachInvite[]>("/api/invites"),
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string | null) => apiPost<CoachInvite>("/api/invites", { email: email || null }),
    onSuccess: (inv) => {
      toast.success("Invite created", { description: `Code: ${inv.invite_code}` });
      qc.invalidateQueries({ queryKey: ["coach-invites"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/api/invites/${id}`, { status: "revoked" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach-invites"] }),
  });
}
