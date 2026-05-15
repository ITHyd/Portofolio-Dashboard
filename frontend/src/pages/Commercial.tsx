import { useEffect, useState } from "react";
import { BadgePoundSterling, Info } from "lucide-react";
import { api } from "@/lib/api";
import { useHScroll } from "@/lib/useHScroll";

interface Project {
  id: number;
  name: string;
  client: string;
}

interface Row {
  id?: number;
  project_id: number;
  period_month: string;
  contract_value_gbp: number | null;
  revenue_plan_mtd: number | null;
  revenue_actual_mtd: number | null;
  margin_forecast_pct: number | null;
  pipeline_stage: string | null;
  pipeline_value_gbp: number | null;
  repeat_or_new: string | null;
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function InfoHint({ text }: { text: string }) {
  return (
    <button
      type="button"
      title={text}
      aria-label={text}
      className="rounded-full p-1 text-violet-soft transition-colors hover:bg-violet-soft/10"
    >
      <Info size={14} />
    </button>
  );
}

export function Commercial() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [rows, setRows] = useState<Record<number, Row>>({});
  const month = monthStart();
  const scrollRef = useHScroll<HTMLDivElement>();

  useEffect(() => {
    api.get<Project[]>("/projects").then((r) => setProjects(r.data));
    api.get<Row[]>("/commercial", { params: { period_month: month } }).then((r) => {
      const map: Record<number, Row> = {};
      r.data.forEach((x) => (map[x.project_id] = x));
      setRows(map);
    });
  }, [month]);

  function patch(pid: number, p: Partial<Row>) {
    setRows((s) => {
      const existing: Row = s[pid] ?? {
        project_id: pid,
        period_month: month,
        contract_value_gbp: null,
        revenue_plan_mtd: null,
        revenue_actual_mtd: null,
        margin_forecast_pct: null,
        pipeline_stage: null,
        pipeline_value_gbp: null,
        repeat_or_new: null,
      };
      return { ...s, [pid]: { ...existing, ...p } };
    });
  }

  async function save(pid: number) {
    await api.post("/commercial", { ...rows[pid], project_id: pid, period_month: month });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BadgePoundSterling size={16} className="text-ink-muted" />
        <h1 className="font-display text-xl">Commercial - {month.slice(0, 7)}</h1>
        <InfoHint text="Maintain monthly commercial performance including contract value, revenue plan vs actuals, margin forecast, and pipeline outlook." />
      </div>
      <div ref={scrollRef} className="card overflow-x-auto p-5">
        <table className="w-full min-w-[1350px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
              <th className="pb-3 pr-5 whitespace-nowrap" title="Project name from the portfolio register.">Project</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Total contract value for the project in GBP.">Contract GBP</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Planned month-to-date revenue for the project.">Rev Plan MTD</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Actual month-to-date revenue recorded for the project.">Rev Actual MTD</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Forecast margin percentage expected for the project.">Margin Forecast %</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Current pipeline maturity stage linked to the project or opportunity.">Pipeline Stage</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Pipeline value in GBP associated with the project or follow-on opportunity.">Pipeline GBP</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Indicates whether the work is repeat business or a new logo/new assignment.">Repeat / New</th>
              <th className="pb-3" title="Save commercial values for this project row."></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const r = rows[p.id];
              return (
                <tr key={p.id} className="border-t border-bg-border/60">
                  <td className="py-3 pr-5 text-ink whitespace-nowrap">{p.name}</td>
                  {(["contract_value_gbp", "revenue_plan_mtd", "revenue_actual_mtd", "margin_forecast_pct"] as const).map((f) => (
                    <td key={f} className="py-3 pr-5">
                      <input type="number" className="input w-32" value={(r?.[f] as number | null) ?? ""} onChange={(e) => patch(p.id, { [f]: e.target.value === "" ? null : Number(e.target.value) } as never)} />
                    </td>
                  ))}
                  <td className="py-3 pr-5">
                    <input className="input w-36" value={r?.pipeline_stage ?? ""} onChange={(e) => patch(p.id, { pipeline_stage: e.target.value })} />
                  </td>
                  <td className="py-3 pr-5">
                    <input type="number" className="input w-32" value={r?.pipeline_value_gbp ?? ""} onChange={(e) => patch(p.id, { pipeline_value_gbp: e.target.value === "" ? null : Number(e.target.value) })} />
                  </td>
                  <td className="py-3 pr-5">
                    <select className="input w-32" value={r?.repeat_or_new ?? ""} onChange={(e) => patch(p.id, { repeat_or_new: e.target.value || null })}>
                      <option value="">-</option>
                      <option>Repeat</option>
                      <option>New</option>
                    </select>
                  </td>
                  <td className="py-3"><button className="btn-primary" onClick={() => save(p.id)}>Save</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
