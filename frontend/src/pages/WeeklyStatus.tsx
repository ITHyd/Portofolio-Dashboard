import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const RAG = ["Green", "Amber", "Red"] as const;
type Rag = (typeof RAG)[number];

interface Project { id: number; name: string; client: string; }
interface Row {
  id?: number;
  project_id: number;
  week_ending: string;
  schedule_rag: Rag | null;
  resource_rag: Rag | null;
  scope_rag: Rag | null;
  budget_rag: Rag | null;
  overall_rag: Rag | null;
  key_flag_comment: string | null;
  next_milestone: string | null;
  milestone_due: string | null;
  milestone_status: string | null;
}

function thisWeekEnding() {
  const d = new Date();
  const day = d.getDay();
  const offset = (5 - day + 7) % 7;
  const target = new Date(d);
  target.setDate(d.getDate() + offset);
  return target.toISOString().slice(0, 10);
}

function ragSelectClass(value: Rag | null | undefined) {
  if (value === "Green") {
    return "border-rag-green/60 bg-rag-green/10 focus:ring-rag-green/20";
  }
  if (value === "Amber") {
    return "border-rag-amber/60 bg-rag-amber/10 focus:ring-rag-amber/20";
  }
  if (value === "Red") {
    return "border-rag-red/60 bg-rag-red/10 focus:ring-rag-red/20";
  }
  return "border-bg-border bg-white";
}

export function WeeklyStatus() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [week, setWeek] = useState(thisWeekEnding());
  const [rows, setRows] = useState<Record<number, Row>>({});
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    api.get<Project[]>("/projects").then((r) => setProjects(r.data));
  }, []);

  useEffect(() => {
    api.get<Row[]>("/weekly-status", { params: { week_ending: week } }).then((r) => {
      const map: Record<number, Row> = {};
      r.data.forEach((x) => (map[x.project_id] = x));
      setRows(map);
    });
  }, [week]);

  function set(pid: number, patch: Partial<Row>) {
    setRows((s) => {
      const existing: Row = s[pid] ?? {
        project_id: pid,
        week_ending: week,
        schedule_rag: null,
        resource_rag: null,
        scope_rag: null,
        budget_rag: null,
        overall_rag: null,
        key_flag_comment: null,
        next_milestone: null,
        milestone_due: null,
        milestone_status: null,
      };
      return { ...s, [pid]: { ...existing, ...patch } };
    });
  }

  async function save(pid: number) {
    const row = rows[pid];
    if (!row) return;
    const hasRed = [row.schedule_rag, row.resource_rag, row.scope_rag, row.budget_rag, row.overall_rag].includes("Red");
    if (hasRed && !row.key_flag_comment?.trim()) {
      alert("Red RAG requires a Key Flag / Comment.");
      return;
    }
    setSaving(pid);
    try {
      await api.post("/weekly-status", { ...row, week_ending: week, project_id: pid });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-xl">Weekly Status Update</h1>
        <div>
          <label className="label">Week ending</label>
          <input type="date" className="input w-44" value={week} onChange={(e) => setWeek(e.target.value)} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-xs xl:text-sm">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[6.5%]" />
              <col className="w-[6.5%]" />
              <col className="w-[6.5%]" />
              <col className="w-[6.5%]" />
              <col className="w-[6.5%]" />
              <col className="w-[15%]" />
              <col className="w-[11.5%]" />
              <col className="w-[9.5%]" />
              <col className="w-[8%]" />
              <col className="w-[8.5%]" />
            </colgroup>
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
                <th className="pb-2 pr-2">Project</th>
                {["Schedule", "Resource", "Scope", "Budget", "Overall"].map((c) => (
                  <th key={c} className="pb-2 px-1 text-center">{c}</th>
                ))}
                <th className="pb-2 px-2">Key Flag / Comment</th>
                <th className="pb-2 px-2">Next Milestone</th>
                <th className="pb-2 px-1">Due</th>
                <th className="pb-2 px-1">Status</th>
                <th className="pb-2 pl-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const r = rows[p.id];
                return (
                  <tr key={p.id} className="border-t border-bg-border/60 align-top">
                    <td className="py-2 pr-2">
                      <div className="font-semibold text-ink">{p.name}</div>
                      <div className="truncate text-[11px] text-ink-muted">{p.client}</div>
                    </td>
                    {(["schedule_rag", "resource_rag", "scope_rag", "budget_rag", "overall_rag"] as const).map((field) => (
                      <td key={field} className="px-1 py-2">
                        <select
                          className={cn(
                            "input w-full min-w-0 bg-white px-2 py-2 text-xs font-semibold text-ink",
                            ragSelectClass(r?.[field] ?? null)
                          )}
                          value={r?.[field] ?? ""}
                          onChange={(e) => set(p.id, { [field]: (e.target.value || null) as Rag | null } as any)}
                        >
                          <option value="">-</option>
                          {RAG.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <textarea
                        className="input min-h-[68px] px-3 py-2 text-xs"
                        rows={3}
                        value={r?.key_flag_comment ?? ""}
                        onChange={(e) => set(p.id, { key_flag_comment: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className="input px-3 py-2 text-xs"
                        value={r?.next_milestone ?? ""}
                        onChange={(e) => set(p.id, { next_milestone: e.target.value })}
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        type="date"
                        className="input px-2 py-2 text-xs"
                        value={r?.milestone_due ?? ""}
                        onChange={(e) => set(p.id, { milestone_due: e.target.value || null })}
                      />
                    </td>
                    <td className="px-1 py-2">
                      <input
                        className="input px-2 py-2 text-xs"
                        value={r?.milestone_status ?? ""}
                        onChange={(e) => set(p.id, { milestone_status: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pl-2">
                      <button
                        className="btn-primary min-w-[88px] justify-center whitespace-nowrap px-3"
                        onClick={() => save(p.id)}
                        disabled={saving === p.id}
                      >
                        <Save size={14} /> {saving === p.id ? "Saving" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
