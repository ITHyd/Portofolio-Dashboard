import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck2, Clock3, History, Info, Save, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";

const RAG = ["Green", "Amber", "Red"] as const;
type Rag = (typeof RAG)[number];

interface Project {
  id: number;
  name: string;
  client: string;
  pm_name: string | null;
}

interface Row {
  id?: number;
  project_id: number;
  week_ending: string;
  schedule_rag: Rag | null;
  resource_rag: Rag | null;
  scope_rag: Rag | null;
  budget_rag: Rag | null;
  overall_rag: Rag | null;
  weekly_update: string | null;
  update_date: string | null;
  delivery_lead: string | null;
  next_milestone: string | null;
  milestone_due: string | null;
  milestone_status: string | null;
  updated_at?: string;
}

function lastFriday() {
  const d = new Date();
  const day = d.getDay();
  const offset = day >= 5 ? day - 5 : day + 2;
  const target = new Date(d);
  target.setDate(d.getDate() - offset);
  return target.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function ragSelectClass(value: Rag | null | undefined) {
  if (value === "Green") return "border-rag-green/60 bg-rag-green/10 focus:ring-rag-green/20";
  if (value === "Amber") return "border-rag-amber/60 bg-rag-amber/10 focus:ring-rag-amber/20";
  if (value === "Red") return "border-rag-red/60 bg-rag-red/10 focus:ring-rag-red/20";
  return "border-bg-border bg-white";
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

function buildBlankRow(project: Project, week: string, fallbackLead?: string | null): Row {
  return {
    project_id: project.id,
    week_ending: week,
    schedule_rag: null,
    resource_rag: null,
    scope_rag: null,
    budget_rag: null,
    overall_rag: null,
    weekly_update: null,
    update_date: todayIso(),
    delivery_lead: project.pm_name || fallbackLead || "",
    next_milestone: null,
    milestone_due: null,
    milestone_status: null,
  };
}

export function WeeklyStatus() {
  const user = useAuth((s) => s.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [week, setWeek] = useState(lastFriday());
  const [rows, setRows] = useState<Record<number, Row>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [historyRows, setHistoryRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const modalRow = selectedProject
    ? rows[selectedProject.id] ?? buildBlankRow(selectedProject, week, user?.full_name ?? null)
    : null;

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingHistory(true);
    api.get<Row[]>(`/weekly-status/history/${selectedProjectId}`)
      .then((r) => setHistoryRows(r.data.slice().reverse()))
      .finally(() => setLoadingHistory(false));
  }, [selectedProjectId]);

  function setRow(pid: number, patch: Partial<Row>) {
    const project = projects.find((entry) => entry.id === pid);
    if (!project) return;
    setRows((state) => {
      const existing = state[pid] ?? buildBlankRow(project, week, user?.full_name ?? null);
      return { ...state, [pid]: { ...existing, ...patch } };
    });
  }

  async function save(pid: number) {
    const project = projects.find((entry) => entry.id === pid);
    if (!project) return;
    const row = rows[pid] ?? buildBlankRow(project, week, user?.full_name ?? null);

    if (!row.update_date || !row.delivery_lead?.trim()) {
      alert("Update date and delivery lead are required.");
      return;
    }
    if ([row.schedule_rag, row.resource_rag, row.scope_rag, row.budget_rag, row.overall_rag].includes("Red") && !row.weekly_update?.trim()) {
      alert("Red RAG requires a weekly update.");
      return;
    }

    setSaving(pid);
    try {
      const { data } = await api.post<Row>("/weekly-status", row);
      setRows((state) => ({ ...state, [pid]: data }));
      setSelectedProjectId(null);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 size={16} className="text-ink-muted" />
            <h1 className="font-display text-xl">Weekly Status Update</h1>
            <InfoHint text="Open a project to view previous submissions and update the current week's status. Update date and delivery lead are required for every submission." />
          </div>
        </div>
        <div>
          <label className="label">Week ending</label>
          <input type="date" className="input w-44" value={week} onChange={(e) => setWeek(e.target.value)} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-x-auto p-4">
        <table className="w-full min-w-[1120px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
              <th className="pb-3 pr-4" title="Project name from the portfolio register.">Project</th>
              <th className="pb-3 pr-4" title="Client linked to the project.">Client</th>
              <th className="pb-3 pr-4" title="Named delivery lead responsible for the weekly update.">Delivery Lead</th>
              <th className="pb-3 pr-4" title="Date the weekly update was submitted or last refreshed.">Update Date</th>
              <th className="pb-3 pr-4" title="Overall project RAG for the selected reporting week.">Overall RAG</th>
              <th className="pb-3 pr-4" title="Short narrative summary for the latest weekly status.">Weekly Update</th>
              <th className="pb-3 pr-4" title="Immediate next milestone being tracked for the current week.">Current Milestone</th>
              <th className="pb-3" title="Open the weekly status pop-up for this project.">Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const row = rows[project.id];
              return (
                <tr key={project.id} className="border-t border-bg-border/60">
                  <td className="py-3 pr-4 text-ink">{project.name}</td>
                  <td className="py-3 pr-4 text-ink-muted">{project.client}</td>
                  <td className="py-3 pr-4 text-ink-muted">{row?.delivery_lead || project.pm_name || "-"}</td>
                  <td className="py-3 pr-4 text-ink-muted">{row?.update_date || "-"}</td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      "inline-flex min-w-[84px] justify-center rounded-full border px-3 py-1 text-xs font-semibold",
                      row?.overall_rag === "Green"
                        ? "border-rag-green/40 bg-rag-green/10 text-rag-green"
                        : row?.overall_rag === "Amber"
                          ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"
                          : row?.overall_rag === "Red"
                            ? "border-rag-red/40 bg-rag-red/10 text-rag-red"
                            : "border-bg-border bg-white text-ink-muted"
                    )}>
                      {row?.overall_rag ?? "Blank"}
                    </span>
                  </td>
                  <td className="max-w-[300px] py-3 pr-4 text-ink-muted">{row?.weekly_update?.trim() || "-"}</td>
                  <td className="py-3 pr-4 text-ink-muted">{row?.next_milestone ?? "-"}</td>
                  <td className="py-3">
                    <button className="btn-primary min-w-[108px] justify-center" onClick={() => setSelectedProjectId(project.id)}>
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {selectedProject && modalRow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/35 px-6 py-8 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[24px] border border-bg-border bg-bg-base shadow-[0_24px_80px_-35px_rgba(3,3,4,0.45)]"
            >
              <div className="flex items-start justify-between border-b border-bg-border px-6 py-5">
                <div>
                  <div className="eyebrow mb-2">Weekly Update</div>
                  <h2 className="font-display text-2xl text-ink">{selectedProject.name}</h2>
                  <p className="text-sm text-ink-muted">{selectedProject.client}</p>
                </div>
                <button className="btn-ghost" onClick={() => setSelectedProjectId(null)}>
                  <X size={16} />
                  Close
                </button>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="min-h-0 overflow-y-auto px-6 py-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="label" title="Reporting week ending date for this weekly status submission.">Week ending</label>
                      <input type="date" className="input" value={modalRow.week_ending} onChange={(e) => setRow(selectedProject.id, { week_ending: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" title="Date the weekly update is being submitted or refreshed.">Update date</label>
                      <input type="date" className="input" value={modalRow.update_date ?? todayIso()} onChange={(e) => setRow(selectedProject.id, { update_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" title="Named delivery lead responsible for this weekly status update.">Delivery lead</label>
                      <input className="input" value={modalRow.delivery_lead ?? ""} onChange={(e) => setRow(selectedProject.id, { delivery_lead: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" title="Immediate milestone or checkpoint being tracked for the current reporting week.">Current week milestone</label>
                      <input className="input" value={modalRow.next_milestone ?? ""} onChange={(e) => setRow(selectedProject.id, { next_milestone: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
                    {(["schedule_rag", "resource_rag", "scope_rag", "budget_rag", "overall_rag"] as const).map((field) => (
                      <div key={field}>
                        <label
                          className="label"
                          title={
                            field === "schedule_rag"
                              ? "Indicates whether delivery remains within the agreed timeline."
                              : field === "resource_rag"
                                ? "Indicates whether the project has sufficient staffed capacity and capability."
                                : field === "scope_rag"
                                  ? "Tracks whether delivery remains within agreed scope."
                                  : field === "budget_rag"
                                    ? "Reflects whether cost and margin remain within plan."
                                    : "Overall project RAG for the selected reporting week."
                          }
                        >
                          {field.replace("_rag", "").replace("_", " ")}
                        </label>
                        <select
                          className={cn("input bg-white text-ink", ragSelectClass(modalRow[field]))}
                          value={modalRow[field] ?? ""}
                          onChange={(e) => setRow(selectedProject.id, { [field]: (e.target.value || null) as Rag | null } as Partial<Row>)}
                        >
                          <option value="">-</option>
                          {RAG.map((value) => <option key={value}>{value}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                    <div>
                      <label className="label" title="Narrative summary of current delivery position, actions, risks, or notable change for the week.">Weekly update</label>
                      <textarea
                        className="input min-h-[120px]"
                        rows={5}
                        value={modalRow.weekly_update ?? ""}
                        onChange={(e) => setRow(selectedProject.id, { weekly_update: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label" title="Target due date for the current milestone.">Milestone due</label>
                      <input
                        type="date"
                        className="input"
                        value={modalRow.milestone_due ?? ""}
                        onChange={(e) => setRow(selectedProject.id, { milestone_due: e.target.value || null })}
                      />
                    </div>
                    <div>
                      <label className="label" title="Current progress state of the milestone for this reporting week.">Milestone status</label>
                      <input
                        className="input"
                        value={modalRow.milestone_status ?? ""}
                        onChange={(e) => setRow(selectedProject.id, { milestone_status: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-3">
                    <button className="btn-ghost" onClick={() => setSelectedProjectId(null)}>Cancel</button>
                    <button className="btn-primary min-w-[120px] justify-center" onClick={() => save(selectedProject.id)} disabled={saving === selectedProject.id}>
                      <Save size={14} />
                      {saving === selectedProject.id ? "Saving" : "Save update"}
                    </button>
                  </div>
                </div>

                <div className="min-h-0 border-l border-bg-border bg-bg-elevated/35 px-6 py-5">
                  <div className="mb-3 flex items-center gap-2 font-display text-lg text-ink" title="Historical weekly submissions for this project, shown for reference while updating the current week.">
                    <History size={18} />
                    Previous updates
                  </div>
                  <div className="mb-4 rounded-2xl border border-bg-border bg-white/75 p-3 text-sm text-ink-muted">
                    Blank fields indicate the current week has not been updated yet. PMs can use this history to copy forward context while keeping the current week distinct.
                  </div>
                  <div className="max-h-[calc(100%-88px)] space-y-3 overflow-y-auto pr-1">
                    {loadingHistory && <div className="text-sm text-ink-muted">Loading history...</div>}
                    {!loadingHistory && historyRows.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-bg-border p-4 text-sm text-ink-muted">
                        No prior updates for this project yet.
                      </div>
                    )}
                    {historyRows.map((item) => (
                      <div key={`${item.project_id}-${item.week_ending}`} className="rounded-2xl border border-bg-border bg-white/80 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-ink">{item.week_ending}</div>
                          <span className="chip-muted">{item.overall_rag ?? "No overall RAG"}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-ink-subtle">
                          <Clock3 size={12} />
                          <span>{item.update_date ?? "-"}</span>
                          <span>•</span>
                          <span>{item.delivery_lead ?? "-"}</span>
                        </div>
                        <div className="mt-3 text-sm text-ink-muted">{item.weekly_update?.trim() || "No weekly update provided."}</div>
                        <div className="mt-3 text-xs text-ink-subtle">
                          Milestone: {item.next_milestone ?? "-"} {item.milestone_due ? `(${item.milestone_due})` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
