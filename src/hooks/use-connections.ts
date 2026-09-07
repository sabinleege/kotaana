import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/fetcher";

export type ConnectionParty = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
};
export type Connection = {
  id: string;
  status: string;
  requested_by_role: string;
  my_role: "coach" | "athlete";
  other: ConnectionParty;
  created_at: string;
};
export type Connections = { active: Connection[]; incoming: Connection[]; outgoing: Connection[] };

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["connections"] });
  qc.invalidateQueries({ queryKey: ["my-athletes"] });
  qc.invalidateQueries({ queryKey: ["notifications"] });
}

export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: () => apiGet<Connections>("/api/connections"),
    refetchInterval: 20000,
  });
}

export function useMyConnectCode() {
  return useQuery({
    queryKey: ["connect-code"],
    queryFn: () => apiGet<{ code: string }>("/api/connections/code"),
  });
}

export function useSendConnectionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email?: string; code?: string }) => apiPost("/api/connections/request", input),
    onSuccess: () => {
      toast.success("Request sent — waiting for confirmation");
      invalidate(qc);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRespondToConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "decline" }) =>
      apiPost(`/api/connections/${id}`, { action }),
    onSuccess: (_d, v) => {
      toast.success(v.action === "approve" ? "Connected!" : "Request declined");
      invalidate(qc);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/connections/${id}`),
    onSuccess: () => {
      toast.success("Disconnected");
      invalidate(qc);
    },
    onError: (e: any) => toast.error(e.message),
  });
}
