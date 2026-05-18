import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, Plus, Save, ShieldAlert, X } from "lucide-react";
import { api } from "@/lib/api";
import { SuccessToast } from "@/components/SuccessToast";

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
  date_closed?: string | null;
  weekly_status_id?: number | null;
  escalation_kind?: string | null;
  linked_escalation_id?: number | null;
}

interface Project {
  id: number;
  name: string;
}

const RATINGS = ["Low", "Medium", "High"];
const STATUSES = ["Open", "In Progress", "Closed"];
const TYPES = ["Risk", "Issue"];
const ESCALATION_OPTIONS = ["", "Escalation", "Decision Required"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

function ratingChipClass(value: string | null | undefined) {
  if (value === "High") return "chip-red";
  if (value === "Medium") return "chip-amber";
  if (value === "Low") return "chip-green";
  return "chip-muted";
}

function emptyDraft(): Partial<Item> {
  return {
    type: "Risk",
    rating: "Medium",
    status: "Open",
    date_raised: todayIso(),
    escalation_kind: null,
  };
}

export function RisksIssues() {
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState<number | "new" | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Partial<Item>>(emptyDraft());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function load() {
    const r = await api.get<Item[]>("/risks-issues");
    setItems(r.data);
  }

  function loadProjects() {
    api.get<Project[]>("/projects").then((r) => setProjects(r.data));
  }

  useEffect(() => {
    loadProjects();
    load();
  }, []);

  useEffect(() => {
    if (selectedItemId === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedItemId]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const onFocus = () => {
      load();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    const onRiskSync = () => {
      load();
    };
    const onProjectCreated = () => {
      loadProjects();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("portfolio-risk-sync", onRiskSync);
    window.addEventListener("portfolio-project-created", onProjectCreated);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("portfolio-risk-sync", onRiskSync);
      window.removeEventListener("portfolio-project-created", onProjectCreated);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const selectedItem = useMemo(
    () => (typeof selectedItemId === "number" ? items.find((item) => item.id === selectedItemId) ?? null : null),
    [items, selectedItemId]
  );

  function projectName(projectId: number) {
    return projects.find((project) => project.id === projectId)?.name ?? "-";
  }

  function openNewModal() {
    setDraft(emptyDraft());
    setSelectedItemId("new");
  }

  function openEditModal(item: Item) {
    setDraft({ ...item });
    setSelectedItemId(item.id ?? null);
  }

  function closeModal() {
    setSelectedItemId(null);
    setDraft(emptyDraft());
  }

  async function saveDraft() {
    if (!draft.project_id || !draft.description) return;
    const payload = {
      project_id: draft.project_id,
      type: draft.type,
      rating: draft.rating,
      description: draft.description,
      owner: draft.owner,
      status: draft.status,
      date_raised: draft.date_raised || todayIso(),
      date_closed: draft.date_closed ?? null,
      escalation_kind: draft.escalation_kind || null,
    };

    if (selectedItemId === "new") {
      setSaving("new");
      try {
        const { data } = await api.post<Item>("/risks-issues", payload);
        setItems((current) => [data, ...current]);
        setDraft({ ...data });
        setSelectedItemId(data.id ?? null);
        window.dispatchEvent(new Event("portfolio-escalation-sync"));
        setToastMessage("Risk / issue saved successfully");
      } finally {
        setSaving(null);
      }
      return;
    }

    if (!selectedItem?.id) return;
    setSaving(selectedItem.id);
    try {
      const { data } = await api.patch<Item>(`/risks-issues/${selectedItem.id}`, payload);
      setItems((current) => current.map((row) => (row.id === selectedItem.id ? data : row)));
      setDraft({ ...data });
      window.dispatchEvent(new Event("portfolio-escalation-sync"));
      setToastMessage("Risk / issue saved successfully");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-ink-muted" />
          <h1 className="font-display text-xl">Risks & Issues</h1>
          <InfoHint text="Capture live risks and delivery issues that need mitigation, ownership, status tracking, and optional escalation routing." />
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <Plus size={14} />
          New Risk / Issue
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-x-auto p-5">
        <table className="w-full min-w-[1120px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
              <th className="pb-2 pr-3" title="Project linked to this risk or issue.">Project</th>
              <th className="pb-2 pr-3" title="Whether the item is a risk or an issue.">Type</th>
              <th className="pb-2 pr-3" title="Severity rating used to indicate delivery impact level.">Rating</th>
              <th className="pb-2 pr-3" title="Summary of the risk or issue being tracked.">Description</th>
              <th className="pb-2 pr-3" title="Named owner responsible for managing the item.">Owner</th>
              <th className="pb-2 pr-3" title="Current lifecycle state of the item.">Status</th>
              <th className="pb-2 pr-3" title="Route the item into the Escalations tab as either an Escalation or Decision Required entry.">Escalation Flow</th>
              <th className="pb-2 pr-3" title="Date the risk or issue was first raised.">Raised</th>
              <th className="pb-2" title="Open the detailed update pop-up for this row.">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-bg-border/60">
                <td className="py-3 pr-3 text-ink">{projectName(item.project_id)}</td>
                <td className="py-3 pr-3 text-ink-muted">{item.type ?? "-"}</td>
                <td className="py-3 pr-3">
                  <span className={ratingChipClass(item.rating)}>{item.rating ?? "-"}</span>
                </td>
                <td className="max-w-[420px] py-3 pr-3 text-ink">{item.description ?? "-"}</td>
                <td className="py-3 pr-3 text-ink-muted">{item.owner ?? "-"}</td>
                <td className="py-3 pr-3 text-ink-muted">{item.status ?? "-"}</td>
                <td className="py-3 pr-3 text-ink-muted">{item.escalation_kind ?? "-"}</td>
                <td className="py-3 pr-3 text-ink-muted whitespace-nowrap">{item.date_raised ?? "-"}</td>
                <td className="py-3">
                  <button className="btn-primary min-w-[108px] justify-center" onClick={() => openEditModal(item)}>
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {selectedItemId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/35 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-bg-border bg-bg-base shadow-[0_24px_80px_-35px_rgba(3,3,4,0.45)]"
            >
              <div className="flex items-start justify-between border-b border-bg-border px-6 py-5">
                <div>
                  <div className="eyebrow mb-2">Risk / Issue Update</div>
                  <h2 className="font-display text-2xl text-ink">
                    {selectedItemId === "new" ? "Create New Risk / Issue" : draft.description?.trim() || "Update Risk / Issue"}
                  </h2>
                  <p className="text-sm text-ink-muted">
                    {selectedItemId === "new" ? "Add a new delivery risk or issue." : "Update the current risk or issue and route it to escalations if needed."}
                  </p>
                </div>
                <button className="btn-ghost" onClick={closeModal}>
                  <X size={16} />
                  Close
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="label" title="Project linked to this risk or issue.">Project</label>
                    <select className="input" value={draft.project_id ?? ""} onChange={(e) => setDraft((current) => ({ ...current, project_id: Number(e.target.value) }))}>
                      <option value="">-</option>
                      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" title="Whether the record is tracked as a risk or an issue.">Type</label>
                    <select className="input" value={draft.type ?? "Risk"} onChange={(e) => setDraft((current) => ({ ...current, type: e.target.value }))}>
                      {TYPES.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" title="Severity rating for the item.">Rating</label>
                    <select className="input" value={draft.rating ?? "Medium"} onChange={(e) => setDraft((current) => ({ ...current, rating: e.target.value }))}>
                      {RATINGS.map((rating) => <option key={rating}>{rating}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" title="Current lifecycle status for the item.">Status</label>
                    <select className="input" value={draft.status ?? "Open"} onChange={(e) => setDraft((current) => ({ ...current, status: e.target.value }))}>
                      {STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" title="Date the risk or issue was first raised.">Raised date</label>
                    <input type="date" className="input" value={draft.date_raised ?? todayIso()} onChange={(e) => setDraft((current) => ({ ...current, date_raised: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label" title="Route the item into the Escalations tab as an Escalation or Decision Required item.">Escalation Flow</label>
                    <select className="input" value={draft.escalation_kind ?? ""} onChange={(e) => setDraft((current) => ({ ...current, escalation_kind: e.target.value || null }))}>
                      {ESCALATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option || "-"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1.25fr_0.75fr]">
                  <div>
                    <label className="label" title="Summary of the risk or issue being tracked.">Description</label>
                    <textarea className="input min-h-[130px]" rows={5} value={draft.description ?? ""} onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label" title="Named owner responsible for managing the item.">Owner</label>
                    <input className="input" value={draft.owner ?? ""} onChange={(e) => setDraft((current) => ({ ...current, owner: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-bg-border px-6 py-4">
                <button className="btn-ghost" onClick={closeModal}>Cancel</button>
                <button className="btn-primary min-w-[132px] justify-center" onClick={saveDraft} disabled={saving === selectedItemId}>
                  <Save size={14} />
                  {saving === selectedItemId ? "Saving" : selectedItemId === "new" ? "Create" : "Save update"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SuccessToast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
