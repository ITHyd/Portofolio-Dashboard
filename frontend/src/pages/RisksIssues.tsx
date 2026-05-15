import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Info, Plus, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface Item {
  id?: number;
  project_id: number;
  type: string | null;
  rating: string | null;
  description: string | null;
  impact_if_unmitigated: string | null;
  mitigation_action: string | null;
  owner: string | null;
  status: string | null;
  date_raised: string | null;
}

interface Project {
  id: number;
  name: string;
}

const RATINGS = ["Low", "Medium", "High", "Very High"];
const STATUSES = ["Open", "In Progress", "Closed"];

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

export function RisksIssues() {
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState<Partial<Item>>({ type: "Risk", rating: "Medium", status: "Open" });

  async function load() {
    const r = await api.get<Item[]>("/risks-issues");
    setItems(r.data);
  }

  useEffect(() => {
    api.get<Project[]>("/projects").then((r) => setProjects(r.data));
    load();
  }, []);

  async function submit() {
    if (!draft.project_id || !draft.description) return;
    await api.post("/risks-issues", {
      ...draft,
      date_raised: draft.date_raised || new Date().toISOString().slice(0, 10),
    });
    setDraft({ type: "Risk", rating: "Medium", status: "Open" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-ink-muted" />
        <h1 className="font-display text-xl">Risks & Issues</h1>
        <InfoHint text="Capture live risks and delivery issues that need mitigation, ownership, and status tracking." />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="label">Project</label>
            <select className="input" value={draft.project_id ?? ""} onChange={(e) => setDraft({ ...draft, project_id: Number(e.target.value) })}>
              <option value="">-</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={draft.type ?? "Risk"} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              <option>Risk</option>
              <option>Issue</option>
            </select>
          </div>
          <div>
            <label className="label">Rating</label>
            <select className="input" value={draft.rating ?? "Medium"} onChange={(e) => setDraft({ ...draft, rating: e.target.value })}>
              {RATINGS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Owner</label>
            <input className="input" value={draft.owner ?? ""} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={draft.status ?? "Open"} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={submit}><Plus size={14} /> Add</button>
          </div>
        </div>
      </motion.div>

      <div className="card overflow-x-auto p-5">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
              <th className="pb-2 pr-3" title="Whether the item is a risk or an issue.">Type</th>
              <th className="pb-2 pr-3" title="Severity rating used to indicate delivery impact level.">Rating</th>
              <th className="pb-2 pr-3" title="Summary of the risk or issue being tracked.">Description</th>
              <th className="pb-2 pr-3" title="Named owner responsible for managing the item.">Owner</th>
              <th className="pb-2 pr-3" title="Current lifecycle state of the item.">Status</th>
              <th className="pb-2" title="Date the risk or issue was first raised.">Raised</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-bg-border/60">
                <td className="py-2 pr-3 text-ink-muted">{r.type ?? "-"}</td>
                <td className="py-2 pr-3">
                  <span className={r.rating === "High" || r.rating === "Very High" ? "chip-red" : r.rating === "Medium" ? "chip-amber" : "chip-muted"}>{r.rating ?? "-"}</span>
                </td>
                <td className="py-2 pr-3 text-ink">{r.description ?? "-"}</td>
                <td className="py-2 pr-3 text-ink-muted">{r.owner ?? "-"}</td>
                <td className="py-2 pr-3 text-ink-muted">{r.status ?? "-"}</td>
                <td className="py-2 text-ink-muted">{r.date_raised ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
