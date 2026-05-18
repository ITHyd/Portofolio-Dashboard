import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, Info } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const CHECKPOINTS = ["B1", "B2", "B3", "I1", "I2", "I3", "I4", "P1", "P2", "P3", "P4", "D1", "D2", "D3", "D4", "D5", "D6", "C1", "C2", "C3", "C4"];
const STATUS_FLOW = ["Not Started", "In Progress", "Completed"] as const;
const CHECKPOINT_INFO: Record<string, string> = {
  B1: "Bid / No-bid review",
  B2: "Technical solutioning sign-off",
  B3: "Risk & assumptions register opened",
  I1: "Project kick-off gate",
  I2: "Project charter approved",
  I3: "Stakeholder & RACI confirmed",
  I4: "Technical architecture review",
  P1: "Baseline plan approved",
  P2: "Design review sign-off",
  P3: "Resource confirmed",
  P4: "Quality & test strategy agreed",
  D1: "Design sign-off",
  D2: "Build checkpoint",
  D3: "Change control checkpoint",
  D4: "Test entry sign-off",
  D5: "UAT exit / client acceptance",
  D6: "Deploy readiness review",
  C1: "Deployment / go-live sign-off",
  C2: "Hypercare / stabilisation gate",
  C3: "Lessons learned",
  C4: "Project closure approved",
};

interface ProjectInfo {
  id: number;
  ref: string | null;
  name: string;
  client: string;
}

interface HeatmapData {
  projects: ProjectInfo[];
  grid: Record<string, Record<string, string>>;
}

interface GovCheckpointItem {
  id: number;
  project_id: number;
  checkpoint_code: string;
  status: string;
}

const cellClass = (status?: string) =>
  status === "Completed" || status === "Complete"
    ? "bg-rag-green/20 text-rag-green"
    : status === "In Progress"
      ? "bg-rag-amber/20 text-rag-amber"
      : "bg-bg-elevated text-ink-subtle";

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

export function Governance() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [itemsByKey, setItemsByKey] = useState<Record<string, GovCheckpointItem>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function loadGovernance() {
    Promise.all([
      api.get<HeatmapData>("/dashboard/governance-heatmap"),
      api.get<GovCheckpointItem[]>("/gov-checkpoints"),
    ]).then(([heatmapRes, itemsRes]) => {
      setData(heatmapRes.data);
      const next: Record<string, GovCheckpointItem> = {};
      itemsRes.data.forEach((item) => {
        next[`${item.project_id}:${item.checkpoint_code}`] = item;
      });
      setItemsByKey(next);
    });
  }

  useEffect(() => {
    loadGovernance();
  }, []);

  useEffect(() => {
    const onProjectCreated = () => {
      loadGovernance();
    };
    window.addEventListener("portfolio-project-created", onProjectCreated);
    return () => window.removeEventListener("portfolio-project-created", onProjectCreated);
  }, []);

  const grid = useMemo(() => data?.grid ?? {}, [data]);

  function setCell(projectId: number, checkpointCode: string, status: string) {
    setData((current) => {
      if (!current) return current;
      return {
        ...current,
        grid: {
          ...current.grid,
          [projectId]: {
            ...(current.grid[String(projectId)] ?? {}),
            [checkpointCode]: status,
          },
        },
      };
    });
  }

  async function cycleStatus(projectId: number, checkpointCode: string) {
    const key = `${projectId}:${checkpointCode}`;
    const existing = itemsByKey[key];
    const currentStatus = existing?.status ?? grid[String(projectId)]?.[checkpointCode] ?? "Not Started";
    const currentIndex = STATUS_FLOW.indexOf((currentStatus as typeof STATUS_FLOW[number]) ?? "Not Started");
    const nextStatus = STATUS_FLOW[(currentIndex + 1) % STATUS_FLOW.length];

    setSavingKey(key);
    setCell(projectId, checkpointCode, nextStatus);

    try {
      if (existing) {
        const { data: saved } = await api.patch<GovCheckpointItem>(`/gov-checkpoints/${existing.id}`, {
          status: nextStatus,
        });
        setItemsByKey((current) => ({ ...current, [key]: saved }));
      } else {
        const { data: saved } = await api.post<GovCheckpointItem>("/gov-checkpoints", {
          project_id: projectId,
          checkpoint_code: checkpointCode,
          status: nextStatus,
        });
        setItemsByKey((current) => ({ ...current, [key]: saved }));
      }
    } finally {
      setSavingKey(null);
    }
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={16} className="text-ink-muted" />
        <h1 className="font-display text-xl">Governance Checkpoints</h1>
        <InfoHint text="Heatmap of governance checkpoint progress across active projects. Click a checkpoint cell to cycle through Not Started, In Progress, and Completed." />
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-x-auto p-5">
        <table className="w-full min-w-[1100px] text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-bg-surface pb-2 pr-3 text-left text-ink-subtle" title="Project name from the active portfolio.">Project</th>
              {CHECKPOINTS.map((c) => <th key={c} className="px-1 pb-2 text-center text-ink-subtle" title={CHECKPOINT_INFO[c]}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.projects.map((p) => (
              <tr key={p.id} className="border-t border-bg-border/60">
                <td className="sticky left-0 bg-bg-surface py-1.5 pr-3 text-sm text-ink">{p.name}</td>
                {CHECKPOINTS.map((c) => {
                  const key = `${p.id}:${c}`;
                  const status = itemsByKey[key]?.status ?? grid[String(p.id)]?.[c] ?? "Not Started";
                  return (
                    <td key={c} className="px-0.5 py-1.5">
                      <button
                        type="button"
                        onClick={() => cycleStatus(p.id, c)}
                        title={`${c}: ${CHECKPOINT_INFO[c]} • ${status}`}
                        className={cn(
                          "grid h-8 w-full place-items-center rounded-md text-[10px] font-medium transition-opacity",
                          cellClass(status),
                          savingKey === key && "opacity-60"
                        )}
                      >
                        {status === "Completed" || status === "Complete" ? "C" : status === "In Progress" ? "I" : "-"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-green/30" /> Completed</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-amber/30" /> In Progress</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-bg-elevated" /> Not Started</span>
          <span className="text-ink-muted">Click any cell to update.</span>
        </div>
      </motion.div>
    </div>
  );
}
