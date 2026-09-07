"use client";

/** 500ml-style water glass — click to fill/finish a glass. */
import { useProfile, useUpdateProfile } from "@/hooks/use-athlete-data";

export function WaterGlass() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const p: any = profile ?? {};
  const water = p.water_glasses ?? 0;
  const target = p.water_target ?? 8;
  const pct = Math.min(100, Math.round((water / target) * 100));

  function addGlass() {
    update.mutate({ water_glasses: water + 1 });
  }

  return (
    <button
      type="button"
      onClick={addGlass}
      className="group relative mx-auto flex h-40 w-24 flex-col items-center justify-end overflow-hidden rounded-b-2xl rounded-t-lg border-2 border-sky-400/60 bg-sky-500/5 transition hover:border-sky-400"
      title="Tap to drink 500ml"
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-500 to-sky-300/80 transition-all duration-500"
        style={{ height: `${pct}%` }}
      />
      <div className="relative z-10 mb-2 text-xs font-semibold text-foreground drop-shadow">
        {water}/{target}
      </div>
      <div className="relative z-10 mb-1 text-[10px] text-muted-foreground">+500ml</div>
    </button>
  );
}
