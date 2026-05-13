import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: number | string;
  suffix?: string;
  trend?: { x: string; y: number }[];
  accent?: "indigo" | "cyan" | "green" | "amber" | "red";
  delay?: number;
  pulse?: boolean;
}

const accentMap = {
  indigo: { stroke: "#AD96DC", text: "text-violet-soft" },
  cyan: { stroke: "#74D1EA", text: "text-cyan-soft" },
  green: { stroke: "#10B981", text: "text-rag-green" },
  amber: { stroke: "#F59E0B", text: "text-rag-amber" },
  red: { stroke: "#EF4444", text: "text-rag-red" },
};

export function KpiTile({ label, value, suffix, trend, accent = "indigo", delay = 0, pulse }: Props) {
  const numeric = typeof value === "number" ? value : Number.isFinite(Number(value)) ? Number(value) : null;
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest: number): string =>
    numeric === null
      ? String(value)
      : Number.isInteger(numeric)
        ? Math.round(latest).toString()
        : latest.toFixed(1)
  );

  useEffect(() => {
    if (numeric === null) return;
    const ctrl = animate(mv, numeric, { duration: 0.9, delay });
    return () => ctrl.stop();
  }, [numeric, mv, delay]);

  const a = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("card card-hover relative overflow-hidden p-5", pulse && "animate-pulse-glow")}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-soft/70 to-transparent" />
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-ink-subtle">{label}</div>
      <div className="mt-2 flex items-end gap-1">
        <motion.div className={cn("font-display text-3xl font-semibold", a.text)}>
          {numeric === null ? value : <motion.span>{rounded}</motion.span>}
        </motion.div>
        {suffix && <div className="pb-1 text-sm text-ink-muted">{suffix}</div>}
      </div>
      {trend && trend.length > 1 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line
                type="monotone"
                dataKey="y"
                stroke={a.stroke}
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
