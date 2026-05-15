import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderKanban, Info, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useHScroll } from "@/lib/useHScroll";

interface Project {
  id: number;
  ref: string | null;
  name: string;
  client: string;
  sub_proposition: string | null;
  phase: string | null;
  status: string;
  start_date: string | null;
  end_date_baseline: string | null;
  end_date_forecast: string | null;
  pm_name: string | null;
  cp_name: string | null;
  current_milestone: string | null;
  current_milestone_due: string | null;
  current_milestone_status: string | null;
}

const MILESTONE_STATUS = ["On Track", "At Risk", "Blocked", "Complete"];

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

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function Projects() {
  const [rows, setRows] = useState<Project[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const scrollRef = useHScroll<HTMLDivElement>();

  useEffect(() => {
    api.get<Project[]>("/projects").then((r) => setRows(r.data));
  }, []);

  function patch(id: number, patchValue: Partial<Project>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patchValue } : row)));
  }

  async function save(id: number) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    setSaving(id);
    try {
      await api.patch(`/projects/${id}`, {
        current_milestone: row.current_milestone,
        current_milestone_due: row.current_milestone_due,
        current_milestone_status: row.current_milestone_status,
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban size={16} className="text-ink-muted" />
            <h1 className="font-display text-xl">Project Register</h1>
          </div>
          <p className="text-sm text-ink-muted">{rows.length} projects</p>
        </div>
      </div>

      <motion.div
        ref={scrollRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card overflow-x-auto p-5"
      >
        <table className="w-full min-w-[1680px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
              <th className="pb-3 pr-5 whitespace-nowrap" title="Portfolio reference code for the project.">Ref</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Project name from the portfolio register.">Project</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Client associated with the project.">Client</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Delivery proposition, practice, or service line the project sits under.">Sub-Proposition / Practice</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Current delivery lifecycle phase for the project.">Phase</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Planned project start date.">Start</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Approved baseline end date for the project.">End (Baseline)</th>
              <th className="pb-3 pr-5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  End (Forecast)
                  <InfoHint text="If the forecast date is later than the baseline date, the schedule is considered slipped." />
                </span>
              </th>
              <th className="pb-3 pr-5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  Current Milestone
                  <InfoHint text="The immediate delivery checkpoint the project team is currently working toward." />
                </span>
              </th>
              <th className="pb-3 pr-5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  Milestone Due
                  <InfoHint text="Target due date for the current milestone." />
                </span>
              </th>
              <th className="pb-3 pr-5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  Milestone Status
                  <InfoHint text="Focused progress status for the current milestone without adding extra register clutter." />
                </span>
              </th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Project Manager accountable for delivery updates.">PM</th>
              <th className="pb-3 pr-5 whitespace-nowrap" title="Client Partner or commercial/account lead for the project.">CP</th>
              <th className="pb-3 whitespace-nowrap" title="Save milestone changes for this project row.">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const slipped =
                p.end_date_baseline &&
                p.end_date_forecast &&
                new Date(p.end_date_forecast) > new Date(p.end_date_baseline);
              return (
                <tr key={p.id} className="border-t border-bg-border/60 align-top">
                  <td className="py-3 pr-5 text-ink-muted whitespace-nowrap">{p.ref ?? "-"}</td>
                  <td className="py-3 pr-5 text-ink whitespace-nowrap">{p.name}</td>
                  <td className="py-3 pr-5 text-ink-muted whitespace-nowrap">{p.client}</td>
                  <td className="py-3 pr-5 text-ink-muted whitespace-nowrap">{p.sub_proposition ?? "-"}</td>
                  <td className="py-3 pr-5 text-ink-muted whitespace-nowrap">{p.phase ?? "-"}</td>
                  <td className="py-3 pr-5 text-ink-muted whitespace-nowrap">{fmtDate(p.start_date)}</td>
                  <td className="py-3 pr-5 text-ink-muted whitespace-nowrap">{fmtDate(p.end_date_baseline)}</td>
                  <td
                    className={
                      "py-3 pr-5 whitespace-nowrap " + (slipped ? "text-rag-amber" : "text-ink-muted")
                    }
                    title={slipped ? "Forecast end is later than baseline" : undefined}
                  >
                    {fmtDate(p.end_date_forecast)}
                  </td>
                  <td className="py-3 pr-5">
                    <input
                      className="input min-w-[220px]"
                      value={p.current_milestone ?? ""}
                      onChange={(e) => patch(p.id, { current_milestone: e.target.value })}
                    />
                  </td>
                  <td className="py-3 pr-5">
                    <input
                      type="date"
                      className="input min-w-[170px]"
                      value={p.current_milestone_due ?? ""}
                      onChange={(e) => patch(p.id, { current_milestone_due: e.target.value || null })}
                    />
                  </td>
                  <td className="py-3 pr-5">
                    <select
                      className="input min-w-[170px]"
                      value={p.current_milestone_status ?? ""}
                      onChange={(e) => patch(p.id, { current_milestone_status: e.target.value || null })}
                    >
                      <option value="">-</option>
                      {MILESTONE_STATUS.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-5 text-ink-muted whitespace-nowrap">{p.pm_name ?? "-"}</td>
                  <td className="py-3 pr-5 text-ink-muted whitespace-nowrap">{p.cp_name ?? "-"}</td>
                  <td className="py-3 whitespace-nowrap">
                    <button className="btn-primary min-w-[88px] justify-center" onClick={() => save(p.id)} disabled={saving === p.id}>
                      <Save size={14} /> {saving === p.id ? "Saving" : "Save"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
