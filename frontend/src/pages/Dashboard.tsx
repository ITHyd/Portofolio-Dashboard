import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertOctagon, AlertTriangle, Briefcase, Users } from "lucide-react";
import { api } from "@/lib/api";
import { KpiTile } from "@/components/KpiTile";
import { RagDot } from "@/components/RagDot";
import { useChartTheme } from "@/lib/chartTheme";

interface Summary {
  week_ending: string;
  kpis: {
    active_projects: number;
    active_clients: number;
    overall_rag: string;
    rag_mix: { green: number; amber: number; red: number; counts: { green: number; amber: number; red: number } };
    on_time_pct: number;
    projects_behind_schedule: number;
    resource_gaps_flagged: number;
    utilisation_uk: number;
    utilisation_india: number;
    unassigned_pct: number;
    unbillable_pct: number;
    billable_utilisation: number;
    open_risks: number;
    open_issues: number;
    open_escalations: number;
  };
  trend: { week_ending: string; green_pct: number; amber_pct: number; red_pct: number; on_time_pct: number }[];
  project_health: any[];
}

export function Dashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const chart = useChartTheme();

  useEffect(() => {
    api.get<Summary>("/dashboard/summary").then((r) => setData(r.data));
    api.get("/risks-issues", { params: { status: "In Progress" } }).then((r) => setRisks(r.data));
    api.get("/escalations", { params: { status: "Open" } }).then((r) => setEscalations(r.data));
  }, []);

  if (!data) {
    return (
      <div className="grid h-96 place-items-center text-ink-muted">
        <Activity className="animate-spin" />
      </div>
    );
  }

  const k = data.kpis;
  const trendY = (key: keyof Summary["trend"][number]) =>
    data.trend.map((t) => ({ x: t.week_ending, y: Number(t[key]) }));

  const ragPieData = [
    { name: "Green", value: k.rag_mix.counts.green, fill: "#10B981" },
    { name: "Amber", value: k.rag_mix.counts.amber, fill: "#F59E0B" },
    { name: "Red", value: k.rag_mix.counts.red, fill: "#EF4444" },
  ];

  const utilData = [
    { region: "UK", pct: k.utilisation_uk },
    { region: "India", pct: k.utilisation_india },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-subtle">Week ending</div>
          <div className="font-display text-2xl">{new Date(data.week_ending).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip-muted">Auto-refresh on save</span>
          <span className={`chip ${k.overall_rag === "Red" ? "chip-red" : k.overall_rag === "Amber" ? "chip-amber" : "chip-green"}`}>
            Portfolio · {k.overall_rag}
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile label="Active Projects" value={k.active_projects} trend={trendY("on_time_pct")} accent="indigo" delay={0.0} />
        <KpiTile label="Active Clients" value={k.active_clients} accent="cyan" delay={0.05} />
        <KpiTile
          label="Overall RAG"
          value={k.overall_rag}
          accent={k.overall_rag === "Red" ? "red" : k.overall_rag === "Amber" ? "amber" : "green"}
          pulse={k.overall_rag === "Red"}
          delay={0.1}
        />
        <KpiTile label="On Time %" value={k.on_time_pct} suffix="%" trend={trendY("on_time_pct")} accent="green" delay={0.15} />
        <KpiTile label="Resource Gaps" value={k.resource_gaps_flagged} accent="amber" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile label="UK Utilisation" value={k.utilisation_uk} suffix="%" accent="indigo" delay={0.25} />
        <KpiTile label="India Utilisation" value={k.utilisation_india} suffix="%" accent="cyan" delay={0.3} />
        <KpiTile label="Unassigned %" value={k.unassigned_pct} suffix="%" accent="amber" delay={0.35} />
        <KpiTile label="Unbillable %" value={k.unbillable_pct} suffix="%" accent="amber" delay={0.4} />
        <KpiTile label="Billable Util %" value={k.billable_utilisation} suffix="%" accent="green" delay={0.45} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.5 }}
          className="card p-5"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="font-display text-sm font-semibold">Portfolio RAG Mix</div>
            <div className="text-xs text-ink-muted">{k.active_projects} projects</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ragPieData}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive
                  animationDuration={900}
                >
                  {ragPieData.map((d, i) => (
                    <Cell key={i} fill={d.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={chart.tooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-around text-xs">
            <span className="chip-green">Green {k.rag_mix.counts.green}</span>
            <span className="chip-amber">Amber {k.rag_mix.counts.amber}</span>
            <span className="chip-red">Red {k.rag_mix.counts.red}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.55 }}
          className="card p-5"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="font-display text-sm font-semibold">Utilisation — UK vs India</div>
            <Users size={14} className="text-ink-muted" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilData}>
                <XAxis dataKey="region" tick={chart.tick} axisLine={false} tickLine={false} />
                <YAxis tick={chart.tick} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={chart.tooltip} />
                <Bar dataKey="pct" radius={[8, 8, 0, 0]} animationDuration={900}>
                  {utilData.map((_d, i) => (
                    <Cell key={i} fill={i === 0 ? "#6366F1" : "#22D3EE"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.6 }}
          className="card p-5"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="font-display text-sm font-semibold">RAG % — Last 8 Weeks</div>
            <Activity size={14} className="text-ink-muted" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend}>
                <XAxis dataKey="week_ending" tick={chart.smallTick} axisLine={false} tickLine={false} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={chart.tick} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={chart.tooltip} />
                <Bar dataKey="green_pct" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="amber_pct" stackId="a" fill="#F59E0B" />
                <Bar dataKey="red_pct" stackId="a" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Delivery Health table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.65 }}
        className="card p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-sm font-semibold">Delivery Health — by Project</div>
          <Briefcase size={14} className="text-ink-muted" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
                <th className="pb-2 pr-3">Project</th>
                <th className="pb-2 pr-3">Client</th>
                <th className="pb-2 pr-3">Sched</th>
                <th className="pb-2 pr-3">Res</th>
                <th className="pb-2 pr-3">Scope</th>
                <th className="pb-2 pr-3">Bud</th>
                <th className="pb-2 pr-3">Overall</th>
                <th className="pb-2">Next Milestone</th>
              </tr>
            </thead>
            <tbody>
              {data.project_health.map((p) => (
                <tr key={p.project_id} className="border-t border-bg-border/60">
                  <td className="py-2 pr-3 text-ink">{p.name}</td>
                  <td className="py-2 pr-3 text-ink-muted">{p.client}</td>
                  <td className="py-2 pr-3"><RagDot value={p.schedule_rag} /></td>
                  <td className="py-2 pr-3"><RagDot value={p.resource_rag} /></td>
                  <td className="py-2 pr-3"><RagDot value={p.scope_rag} /></td>
                  <td className="py-2 pr-3"><RagDot value={p.budget_rag} /></td>
                  <td className="py-2 pr-3"><RagDot value={p.overall_rag} /></td>
                  <td className="py-2 text-ink-muted">{p.next_milestone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.7 }}
          className="card p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm font-semibold">Open Risks & Issues</div>
            <AlertTriangle size={14} className="text-ink-muted" />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {risks.length === 0 && <div className="text-sm text-ink-muted">Nothing open. Nice.</div>}
            {risks.map((r) => (
              <div key={r.id} className="rounded-xl border border-bg-border bg-bg-elevated/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={r.rating === "High" || r.rating === "Very High" ? "chip-red" : r.rating === "Medium" ? "chip-amber" : "chip-muted"}>
                    {r.type ?? "Risk"} · {r.rating ?? "—"}
                  </span>
                  <span className="text-xs text-ink-subtle">{r.status}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-ink">{r.description}</div>
                <div className="mt-1 text-xs text-ink-muted">Owner: {r.owner ?? "—"}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.75 }}
          className="card p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm font-semibold">Escalations & Decisions Required</div>
            <AlertOctagon size={14} className="text-ink-muted" />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {escalations.length === 0 && <div className="text-sm text-ink-muted">No open escalations.</div>}
            {escalations.map((e) => (
              <div key={e.id} className="rounded-xl border border-bg-border bg-bg-elevated/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={e.severity === "High" ? "chip-red" : e.severity === "Medium" ? "chip-amber" : "chip-muted"}>
                    {e.kind} · {e.severity ?? "—"}
                  </span>
                  <span className="text-xs text-ink-subtle">{new Date(e.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 font-medium text-ink">{e.title}</div>
                {e.description && <div className="mt-1 line-clamp-2 text-ink-muted">{e.description}</div>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
