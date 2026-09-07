import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Was Supabase realtime. Without Supabase we approximate "live" updates by
 * refetching the coach's queries when the tab regains focus/visibility.
 * (A future enhancement could swap this for SSE or WebSocket polling.)
 */
export function useCoachRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ["injuries"] });
      qc.invalidateQueries({ queryKey: ["follow-ups"] });
      qc.invalidateQueries({ queryKey: ["my-athletes"] });
      qc.invalidateQueries({ queryKey: ["coach-sessions"] });
      qc.invalidateQueries({ queryKey: ["coach-invites"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    window.addEventListener("focus", invalidate);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", invalidate);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [qc]);
}
