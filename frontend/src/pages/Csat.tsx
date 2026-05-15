import { useEffect, useState } from "react";
import { Info, MessageSquareHeart, Plus, Star } from "lucide-react";
import { api } from "@/lib/api";

interface Item {
  id?: number;
  project_id: number;
  date_collected: string | null;
  score_1_5: number | null;
  comment: string | null;
  collected_by_name: string | null;
  next_collection_due: string | null;
}

interface Project {
  id: number;
  name: string;
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

export function Csat() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState<Partial<Item>>({ score_1_5: 4, date_collected: new Date().toISOString().slice(0, 10) });

  async function load() {
    const r = await api.get<Item[]>("/csat");
    setItems(r.data);
  }

  useEffect(() => {
    api.get<Project[]>("/projects").then((r) => setProjects(r.data));
    load();
  }, []);

  async function submit() {
    if (!draft.project_id) return;
    await api.post("/csat", draft);
    setDraft({ score_1_5: 4, date_collected: new Date().toISOString().slice(0, 10) });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareHeart size={16} className="text-ink-muted" />
        <h1 className="font-display text-xl">Client Satisfaction</h1>
        <InfoHint text="Capture client sentiment scores, comments, and follow-up collection dates for each project." />
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="label">Project</label>
            <select className="input" value={draft.project_id ?? ""} onChange={(e) => setDraft({ ...draft, project_id: Number(e.target.value) })}>
              <option value="">-</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Score</label>
            <select className="input" value={draft.score_1_5 ?? 4} onChange={(e) => setDraft({ ...draft, score_1_5: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={draft.date_collected ?? ""} onChange={(e) => setDraft({ ...draft, date_collected: e.target.value })} />
          </div>
          <div className="flex items-end"><button className="btn-primary w-full" onClick={submit}><Plus size={14} /> Add</button></div>
          <div className="md:col-span-4">
            <label className="label">Comment</label>
            <textarea className="input" rows={2} value={draft.comment ?? ""} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto p-5">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
              <th className="pb-2 pr-3" title="Date the CSAT input was collected.">Date</th>
              <th className="pb-2 pr-3" title="Client satisfaction score on a 1 to 5 scale.">Score</th>
              <th className="pb-2 pr-3" title="Free-text client feedback or delivery commentary.">Comment</th>
              <th className="pb-2 pr-3" title="Person who collected the feedback.">Collected By</th>
              <th className="pb-2" title="Next planned client feedback collection date.">Next Due</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-bg-border/60">
                <td className="py-2 pr-3 text-ink-muted">{c.date_collected ?? "-"}</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={14} className={n <= (c.score_1_5 ?? 0) ? "fill-rag-amber text-rag-amber" : "text-bg-border"} />
                    ))}
                  </span>
                </td>
                <td className="py-2 pr-3 text-ink">{c.comment ?? "-"}</td>
                <td className="py-2 pr-3 text-ink-muted">{c.collected_by_name ?? "-"}</td>
                <td className="py-2 text-ink-muted">{c.next_collection_due ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
