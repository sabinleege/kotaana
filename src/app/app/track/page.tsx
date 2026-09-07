"use client";

import { useEffect, useRef, useState } from "react";
import { useRuns, useSaveRun, useProfile } from "@/hooks/use-athlete-data";
import { Panel } from "@/components/athlete/ui";
import { MapPin, Play, Square, Loader2, Footprints, Bike, Navigation } from "lucide-react";
import { toast } from "sonner";

type Pt = { lat: number; lng: number; t: number };

function haversine(a: Pt, b: Pt) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s)); // metres
}

const MET: Record<string, number> = { run: 9.8, walk: 3.5, ride: 7.5 };

export default function TrackPage() {
  const { data: runs = [] } = useRuns();
  const { data: profile } = useProfile();
  const save = useSaveRun();

  const [type, setType] = useState<"run" | "walk" | "ride">("run");
  const [tracking, setTracking] = useState(false);
  const [meters, setMeters] = useState(0);
  const [secs, setSecs] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const path = useRef<Pt[]>([]);
  const watchId = useRef<number | null>(null);
  const timer = useRef<any>(null);

  const weight = (profile as any)?.weight ?? 70;
  const km = meters / 1000;
  const paceSec = km > 0 ? secs / km : 0;
  const calories = Math.round((MET[type] * 3.5 * weight / 200) * (secs / 60));

  useEffect(() => () => stop(true), []); // cleanup on unmount

  function start() {
    if (!("geolocation" in navigator)) { setGpsError("Geolocation isn't available on this device."); return; }
    setGpsError(null); setMeters(0); setSecs(0); path.current = [];
    setTracking(true);
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: Pt = { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now() };
        const prev = path.current[path.current.length - 1];
        if (prev) {
          const d = haversine(prev, pt);
          if (d > 2 && d < 100) setMeters((m) => m + d); // ignore jitter & GPS jumps
        }
        path.current.push(pt);
      },
      (err) => setGpsError(err.message || "Couldn't get your location. Allow location access."),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
  }

  function stop(silent = false) {
    setTracking(false);
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    if (timer.current) clearInterval(timer.current);
    watchId.current = null; timer.current = null;
    if (silent) return;
  }

  function finish() {
    stop();
    if (meters < 5) { toast.error("Not enough movement recorded"); return; }
    save.mutate({
      activity_type: type, distance_km: Math.round(km * 100) / 100, duration_sec: secs,
      calories, avg_pace_sec: Math.round(paceSec), source: "gps", path: path.current,
    } as any, { onSuccess: () => { setMeters(0); setSecs(0); path.current = []; } });
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const totalKm = runs.reduce((a, r) => a + Number(r.distance_km), 0);
  const todayKm = runs.filter((r) => r.date.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((a, r) => a + Number(r.distance_km), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Navigation className="h-5 w-5" /></span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Track</h1>
          <p className="text-sm text-muted-foreground">GPS distance for runs, walks &amp; rides — anywhere, not just the gym.</p>
        </div>
      </div>

      {/* Live tracker */}
      <Panel>
        <div className="mb-4 flex gap-2">
          {([["run", Footprints, "Run"], ["walk", MapPin, "Walk"], ["ride", Bike, "Ride"]] as const).map(([k, Icon, lbl]) => (
            <button key={k} onClick={() => !tracking && setType(k)} disabled={tracking}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition ${type === k ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent/10"} ${tracking ? "opacity-60" : ""}`}>
              <Icon className="h-4 w-4" /> {lbl}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <Big label="Distance" value={km.toFixed(2)} unit="km" />
          <Big label="Time" value={fmt(secs)} unit="" />
          <Big label="Calories" value={String(calories)} unit="kcal" />
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Pace {paceSec ? `${Math.floor(paceSec / 60)}:${String(Math.round(paceSec % 60)).padStart(2, "0")} /km` : "—"}
        </div>

        {gpsError && <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{gpsError}</div>}

        <div className="mt-5 flex justify-center gap-3">
          {!tracking ? (
            <button onClick={start} className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-8 py-3 font-medium text-primary-foreground shadow-[var(--glow-primary)] hover:opacity-90">
              <Play className="h-5 w-5" /> Start
            </button>
          ) : (
            <button onClick={finish} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-full bg-destructive px-8 py-3 font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50">
              {save.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Square className="h-5 w-5" />} Finish &amp; save
            </button>
          )}
        </div>
        {tracking && <div className="mt-3 flex items-center justify-center gap-2 text-xs text-primary"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Tracking your location…</div>}
      </Panel>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel><div className="text-sm text-muted-foreground">Distance today</div><div className="mt-1 text-3xl font-bold">{todayKm.toFixed(2)} <span className="text-base text-muted-foreground">km</span></div></Panel>
        <Panel><div className="text-sm text-muted-foreground">Total distance</div><div className="mt-1 text-3xl font-bold">{totalKm.toFixed(1)} <span className="text-base text-muted-foreground">km</span></div></Panel>
      </div>

      {/* History */}
      <Panel title="Recent activities">
        {runs.length === 0 ? (
          <div className="grid h-24 place-items-center text-sm text-muted-foreground">No activities yet. Hit Start above.</div>
        ) : (
          <ul className="divide-y divide-border">
            {runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium capitalize">{r.activity_type} · {Number(r.distance_km).toFixed(2)} km</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {fmt(r.duration_sec)}</div>
                </div>
                <div className="text-sm font-medium text-primary">{r.calories} kcal</div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Big({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 py-4">
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}{unit ? ` (${unit})` : ""}</div>
    </div>
  );
}
