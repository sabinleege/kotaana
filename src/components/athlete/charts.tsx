"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

function TooltipBox({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="font-medium text-foreground">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="mt-0.5 text-muted-foreground">
          <span style={{ color: p.color || p.fill }}>{p.value}</span>
          {unit ? ` ${unit}` : ""}
        </div>
      ))}
    </div>
  );
}

/** Smooth gradient area chart. */
export function AreaTrend({
  data, xKey, yKey, height = 220, unit, color = "var(--color-primary)",
}: {
  data: any[]; xKey: string; yKey: string; height?: number; unit?: string; color?: string;
}) {
  const id = `grad-${yKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 6" vertical={false} opacity={0.5} />
        <XAxis dataKey={xKey} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={36} domain={["dataMin-2", "dataMax+2"]} />
        <Tooltip content={<TooltipBox unit={unit} />} cursor={{ stroke: color, strokeOpacity: 0.3 }} />
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} dot={false} activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Rounded bar chart with a highlighted target line feel. */
export function Bars({
  data, xKey, yKey, height = 200, unit, color = "var(--color-accent)",
}: {
  data: any[]; xKey: string; yKey: string; height?: number; unit?: string; color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 6" vertical={false} opacity={0.5} />
        <XAxis dataKey={xKey} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<TooltipBox unit={unit} />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} maxBarSize={34}>
          {data.map((_, i) => <Cell key={i} fill={color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
