import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
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
import { Activity, BadgePoundSterling, BellRing, FolderKanban, Info, ShieldAlert, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { KpiTile } from "@/components/KpiTile";
import { RagDot } from "@/components/RagDot";
import { useChartTheme } from "@/lib/chartTheme";

interface Summary {
  week_ending: string;
  commercial_month: string | null;
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
    commercial_revenue_plan_mtd: number | null;
    commercial_revenue_actual_mtd: number | null;
    commercial_margin_forecast_pct: number | null;
    commercial_pipeline_value_gbp: number | null;
  };
  trend: { week_ending: string; green_pct: number; amber_pct: number; red_pct: number; on_time_pct: number }[];
  commercial_trend: {
    period_month: string;
    label: string;
    revenue_plan_mtd: number | null;
    revenue_actual_mtd: number | null;
    margin_forecast_pct: number | null;
    pipeline_value_gbp: number | null;
  }[];
  project_health: any[];
}

export function Dashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const chart = useChartTheme();

  function loadDashboard() {
    api.get<Summary>("/dashboard/summary").then((r) => setData(r.data));
    api.get("/risks-issues").then((r) => setRisks((r.data ?? []).filter((item: any) => item.status !== "Closed")));
    api.get("/escalations").then((r) =>
      setEscalations((r.data ?? []).filter((item: any) => item.status === "Open" || item.status === "In Progress"))
    );
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const onProjectCreated = () => {
      loadDashboard();
    };
    const onFocus = () => {
      loadDashboard();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    };
    window.addEventListener("portfolio-project-created", onProjectCreated);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("portfolio-project-created", onProjectCreated);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
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
  const projectNameById = new Map(data.project_health.map((project) => [project.project_id, project.name]));

  function formatGbpCompact(value: number | null) {
    if (value === null || value === undefined) return "No data yet";
    if (Math.abs(value) >= 1_000_000) return `GBP ${(value / 1_000_000).toFixed(2)}m`;
    if (Math.abs(value) >= 1_000) return `GBP ${(value / 1_000).toFixed(0)}k`;
    return `GBP ${value.toFixed(0)}`;
  }

  function formatPct(value: number | null) {
    if (value === null || value === undefined) return "No data yet";
    return `${value.toFixed(1)}%`;
  }

  const commercialPanels = [
    {
      label: "Revenue Plan MTD",
      value: formatGbpCompact(k.commercial_revenue_plan_mtd),
      stroke: "#AD96DC",
      valueClass: "text-violet-soft",
      series: data.commercial_trend.map((point) => ({ month: point.label, value: point.revenue_plan_mtd })),
      info: "Planned month-to-date revenue across the active portfolio.",
    },
    {
      label: "Revenue Actual MTD",
      value: formatGbpCompact(k.commercial_revenue_actual_mtd),
      stroke: "#74D1EA",
      valueClass: "text-cyan-soft",
      series: data.commercial_trend.map((point) => ({ month: point.label, value: point.revenue_actual_mtd })),
      info: "Actual month-to-date revenue delivered across the active portfolio.",
    },
    {
      label: "Margin Forecast %",
      value: formatPct(k.commercial_margin_forecast_pct),
      stroke: "#F59E0B",
      valueClass: "text-rag-amber",
      series: data.commercial_trend.map((point) => ({ month: point.label, value: point.margin_forecast_pct })),
      info: "Forecast portfolio margin percentage based on the latest commercial outlook.",
    },
    {
      label: "Pipeline GBP",
      value: formatGbpCompact(k.commercial_pipeline_value_gbp),
      stroke: "#10B981",
      valueClass: "text-rag-green",
      series: data.commercial_trend.map((point) => ({ month: point.label, value: point.pipeline_value_gbp })),
      info: "Total pipeline value in GBP across tracked opportunities.",
    },
  ];

  function InfoHint({ text }: { text: string }) {
    return (
      <button
        type="button"
        title={text}
        aria-label={text}
        className="rounded-full p-1 text-violet-soft transition-colors hover:bg-violet-soft/10 hover:text-violet-soft"
      >
        <Info size={15} />
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-ink-subtle">Week ending</div>
        <div className="font-display text-2xl">{new Date(data.week_ending).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile
          label="Active Projects"
          value={k.active_projects}
          trend={trendY("on_time_pct")}
          accent="indigo"
          delay={0.0}
          info="Count of projects currently marked as Active in the portfolio register."
        />
        <KpiTile
          label="Active Clients"
          value={k.active_clients}
          accent="cyan"
          delay={0.05}
          info="Distinct client count across all active projects."
        />
        <KpiTile
          label="Overall RAG"
          value={k.overall_rag}
          accent={k.overall_rag === "Red" ? "red" : k.overall_rag === "Amber" ? "amber" : "green"}
          delay={0.1}
          info="Overall portfolio status derived from the latest weekly RAG for each active project. Green means at least 80% of active projects are Green and fewer than 10% are Red. Amber means at least 60% are Green and fewer than 20% are Red. Red means Red projects are 20% or more."
        />
        <KpiTile
          label="On Time %"
          value={k.on_time_pct}
          suffix="%"
          trend={trendY("on_time_pct")}
          accent="green"
          delay={0.15}
          info="Percentage of active projects whose schedule RAG is Green in the latest reporting week."
        />
        <KpiTile
          label="Resource Gaps"
          value={k.resource_gaps_flagged}
          accent="amber"
          delay={0.2}
          info="Number of active projects with Resource RAG flagged as Amber or Red."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile
          label="UK Utilisation"
          value={k.utilisation_uk}
          suffix="%"
          accent="indigo"
          delay={0.25}
          info="Average utilisation percentage for UK resources in the latest available resource week."
        />
        <KpiTile
          label="India Utilisation"
          value={k.utilisation_india}
          suffix="%"
          accent="cyan"
          delay={0.3}
          info="Average utilisation percentage for India resources in the latest available resource week."
        />
        <KpiTile
          label="Unassigned %"
          value={k.unassigned_pct}
          suffix="%"
          accent="amber"
          delay={0.35}
          info="Share of resources currently marked as Bench in the latest resource-week snapshot."
        />
        <KpiTile
          label="Unbillable %"
          value={k.unbillable_pct}
          suffix="%"
          accent="amber"
          delay={0.4}
          info="Portion of recorded hours that are non-billable in the latest resource reporting period."
        />
        <KpiTile
          label="Billable Util %"
          value={k.billable_utilisation}
          suffix="%"
          accent="green"
          delay={0.45}
          info="Portion of recorded hours that are billable in the latest resource reporting period."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.75fr_1fr]">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.5 }}
            className="card p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-sm font-semibold" title="Shows the current split of active projects across Green, Amber, and Red overall RAG states.">
                  Portfolio RAG Mix
                </div>
                <div className="text-xs text-ink-muted">{k.active_projects} projects</div>
              </div>
              <InfoHint text="Shows the current split of active projects across Green, Amber, and Red overall RAG states." />
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
            transition={{ duration: 0.45, delay: 0.6 }}
            className="card p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="font-display text-sm font-semibold" title="Weekly trend of overall portfolio RAG distribution across the last eight reporting weeks.">
                RAG % - Last 8 Weeks
              </div>
              <InfoHint text="Weekly trend of overall portfolio RAG distribution across the last eight reporting weeks." />
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.55 }}
          className="card p-5"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="font-display text-sm font-semibold" title="Compares average utilisation percentages between UK and India resource pools for the latest available reporting week.">
                Utilisation - UK vs India
              </div>
              <UsersRound size={14} className="text-ink-muted" />
            </div>
            <InfoHint text="Compares average utilisation percentages between UK and India resource pools for the latest available reporting week." />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilData}>
                <XAxis dataKey="region" tick={chart.tick} axisLine={false} tickLine={false} />
                <YAxis tick={chart.tick} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={chart.tooltip} />
                <Bar dataKey="pct" radius={[8, 8, 0, 0]} animationDuration={900}>
                  {utilData.map((_d, i) => (
                    <Cell key={i} fill={i === 0 ? "#AD96DC" : "#74D1EA"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BadgePoundSterling size={16} className="text-ink-muted" />
          <div className="font-display text-lg text-ink" title="Core commercial portfolio metrics covering plan, actuals, forecast margin, and pipeline value.">
            Commercial Metrics
          </div>
          <InfoHint text="Core commercial portfolio metrics covering plan, actuals, forecast margin, and pipeline value." />
          {data.commercial_month && <div className="text-xs text-ink-subtle">{data.commercial_month.slice(0, 7)}</div>}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {commercialPanels.map((metric, index) => {
            const hasSeriesData = metric.series.some((point) => point.value !== null && point.value !== undefined);
            return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
              className="card p-5"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-ink-subtle" title={metric.info}>
                    {metric.label}
                  </div>
                  <div className={`mt-2 font-numeric text-3xl font-semibold tracking-[-0.04em] ${metric.valueClass}`}>
                    {metric.value}
                  </div>
                </div>
                <InfoHint text={metric.info} />
              </div>
              <div className="mt-4 h-40">
                {hasSeriesData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metric.series}>
                      <defs>
                        <linearGradient id={`commercial-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={metric.stroke} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={metric.stroke} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={chart.smallTick} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={chart.tooltip} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={metric.stroke}
                        fill={`url(#commercial-${index})`}
                        strokeWidth={2.5}
                        animationDuration={900}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center rounded-2xl border border-dashed border-bg-border bg-bg-elevated/20 text-sm text-ink-subtle">
                    No data yet
                  </div>
                )}
              </div>
            </motion.div>
          )})}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.65 }}
        className="card p-5"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="font-display text-sm font-semibold" title="Project-by-project delivery snapshot across schedule, resource, scope, budget, and overall RAG dimensions.">
              Delivery Health - by Project
            </div>
            <FolderKanban size={14} className="text-ink-muted" />
          </div>
          <InfoHint text="Project-by-project delivery snapshot across schedule, resource, scope, budget, and overall RAG dimensions." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
                <th className="pb-2 pr-3" title="Project name from the portfolio register.">Project</th>
                <th className="pb-2 pr-3" title="Client linked to the project in the portfolio register.">Client</th>
                <th className="pb-2 pr-3" title="Indicates whether forecast delivery remains within the agreed baseline timeline.">Schedule</th>
                <th className="pb-2 pr-3" title="Indicates whether the project has enough staffed capacity and capability to deliver.">Resource</th>
                <th className="pb-2 pr-3" title="Tracks whether delivery remains inside the agreed scope without unmanaged expansion.">Scope</th>
                <th className="pb-2 pr-3" title="Reflects whether cost and margin performance remain within the approved plan.">Budget</th>
                <th className="pb-2 pr-3" title="Overall delivery RAG based on the combined project health assessment for the latest reporting week.">Overall</th>
                <th className="pb-2" title="Next key delivery checkpoint currently planned for the project.">Next Milestone</th>
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
                  <td className="py-2 text-ink-muted">{p.next_milestone ?? "-"}</td>
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="font-display text-sm font-semibold" title="Shows open risks and issues that are still active and may require mitigation or monitoring.">
                Open Risks & Issues
              </div>
              <ShieldAlert size={14} className="text-ink-muted" />
            </div>
            <InfoHint text="Shows open risks and issues that are still active and may require mitigation or monitoring." />
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {risks.length === 0 && <div className="text-sm text-ink-muted">Nothing open. Nice.</div>}
            {risks.map((r) => (
              <div key={r.id} className="rounded-xl border border-bg-border bg-bg-elevated/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={r.rating === "High" || r.rating === "Very High" ? "chip-red" : r.rating === "Medium" ? "chip-amber" : "chip-muted"}>
                    {r.type ?? "Risk"} - {r.rating ?? "-"}
                  </span>
                  <span className="text-xs text-ink-subtle">{r.status}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-ink">{r.description}</div>
                <div className="mt-1 text-xs text-ink-subtle">Project: {projectNameById.get(r.project_id) ?? "-"}</div>
                <div className="mt-1 text-xs text-ink-muted">Owner: {r.owner ?? "-"}</div>
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="font-display text-sm font-semibold" title="Highlights open escalations and decisions that need leadership attention before they affect delivery or client commitments.">
                Escalations & Decisions Required
              </div>
              <BellRing size={14} className="text-ink-muted" />
            </div>
            <InfoHint text="Highlights open escalations and decisions that need leadership attention before they affect delivery or client commitments." />
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {escalations.length === 0 && <div className="text-sm text-ink-muted">No open escalations.</div>}
            {escalations.map((e) => (
              <div key={e.id} className="rounded-xl border border-bg-border bg-bg-elevated/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={e.severity === "High" ? "chip-red" : e.severity === "Medium" ? "chip-amber" : "chip-muted"}>
                    {e.kind} - {e.severity ?? "-"}
                  </span>
                  <span className="text-xs text-ink-subtle">{new Date(e.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 text-xs text-ink-subtle">Project: {projectNameById.get(e.project_id) ?? "-"}</div>
                <div className="mt-1 text-sm text-ink">{e.title}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
