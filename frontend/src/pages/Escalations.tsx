import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, Info, Plus } from "lucide-react";
import { api } from "@/lib/api";

interface Item {
  id?: number;
  project_id: number;
  week_ending: string;
  kind: string;
  title: string;
  description: string | null;
  severity: string | null;
  owner: string | null;
  status: string;
  resolution: string | null;
  created_at?: string;
}

interface Project {
  id: number;
  name: string;
}

const KINDS = ["Escalation", "Decision Required"];
const SEVERITY = ["Low", "Medium", "High"];
const STATUSES = ["Open", "In Progress", "Closed"];

function thisFriday() {
  const d = new Date();
  const offset = (5 - d.getDay() + 7) % 7;
  const t = new Date(d);
  t.setDate(d.getDate() + offset);
  return t.toISOString().slice(0, 10);
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

export function Escalations() {
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState<Partial<Item>>({
    kind: "Escalation",
    severity: "Medium",
    status: "Open",
    week_ending: thisFriday(),
  });

  async function load() {
    const r = await api.get<Item[]>("/escalations");
    setItems(r.data);
  }

  useEffect(() => {
    api.get<Project[]>("/projects").then((r) => setProjects(r.data));
    load();
  }, []);

  async function submit() {
    if (!draft.project_id || !draft.title) return;
    await api.post("/escalations", draft);
    setDraft({ kind: "Escalation", severity: "Medium", status: "Open", week_ending: thisFriday() });
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <BellRing size={16} className="text-ink-muted" />
          <h1 className="font-display text-xl">Escalations & Decisions Required</h1>
          <InfoHint text="Track project escalations and leadership decisions that need action before they affect delivery or client commitments." />
        </div>
        <p className="text-sm text-ink-muted">New screen - owned by PMs, captured per project per week.</p>
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
            <label className="label">Kind</label>
            <select className="input" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input" value={draft.severity ?? "Medium"} onChange={(e) => setDraft({ ...draft, severity: e.target.value })}>
              {SEVERITY.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input className="input" value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Week ending</label>
            <input type="date" className="input" value={draft.week_ending} onChange={(e) => setDraft({ ...draft, week_ending: e.target.value })} />
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
            <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={submit}><Plus size={14} /> Add</button>
          </div>
        </div>
      </motion.div>

      <div className="card p-5">
        {items.length === 0 && <div className="text-sm text-ink-muted">Nothing logged yet.</div>}
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="rounded-xl border border-bg-border bg-bg-elevated/40 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={e.severity === "High" ? "chip-red" : e.severity === "Medium" ? "chip-amber" : "chip-muted"}>{e.kind} - {e.severity ?? "-"}</span>
                  <span className="chip-muted">{e.status}</span>
                </div>
                <span className="text-xs text-ink-subtle">Wk {e.week_ending}</span>
              </div>
              <div className="mt-1 font-medium text-ink">{e.title}</div>
              {e.description && <div className="mt-1 text-sm text-ink-muted">{e.description}</div>}
              <div className="mt-1 text-xs text-ink-subtle">Owner: {e.owner ?? "-"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
