/**
 * Client hook for Track Me status + sync.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/fetcher";

export function useTrackMeStatus() {
  return useQuery({
    queryKey: ["track-me"],
    queryFn: () => apiGet("/api/health/track-me"),
  });
}

export function useSetTrackMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { enabled: boolean; provider?: string }) =>
      apiPost("/api/health/track-me", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["track-me"] }),
  });
}

export function useDistanceSummary(days = 7) {
  return useQuery({
    queryKey: ["distance-summary", days],
    queryFn: () => apiGet(`/api/health/sync?days=${days}`),
  });
}

export function useSyncHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost("/api/health/sync", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distance-summary"] });
      qc.invalidateQueries({ queryKey: ["track-me"] });
    },
  });
}
