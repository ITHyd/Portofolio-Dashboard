import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const CHECKPOINTS = ["B1", "B2", "B3", "I1", "I2", "I3", "I4", "P1", "P2", "P3", "P4", "D1", "D2", "D3", "D4", "D5", "D6", "C1", "C2", "C3", "C4"];

interface ProjectInfo { id: number; ref: string | null; name: string; client: string; }
interface HeatmapData { projects: ProjectInfo[]; grid: Record<string, Record<string, string>>; }

const cellClass = (status?: string) =>
  status === "Complete"
    ? "bg-rag-green/20 text-rag-green"
    : status === "In Progress"
    ? "bg-rag-amber/20 text-rag-amber"
    : "bg-bg-elevated text-ink-subtle";

export function Governance() {
  const [data, setData] = useState<HeatmapData | null>(null);
  useEffect(() => {
    api.get<HeatmapData>("/dashboard/governance-heatmap").then((r) => setData(r.data));
  }, []);
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl">Governance Checkpoints</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-x-auto p-5">
        <table className="w-full min-w-[1100px] text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-bg-surface pb-2 pr-3 text-left text-ink-subtle">Project</th>
              {CHECKPOINTS.map((c) => <th key={c} className="px-1 pb-2 text-center text-ink-subtle">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.projects.map((p) => (
              <tr key={p.id} className="border-t border-bg-border/60">
                <td className="sticky left-0 bg-bg-surface py-1.5 pr-3 text-sm text-ink">{p.name}</td>
                {CHECKPOINTS.map((c) => {
                  const status = data.grid[p.id]?.[c];
                  return (
                    <td key={c} className="px-0.5 py-1.5">
                      <div className={cn("grid h-8 place-items-center rounded-md text-[10px] font-medium", cellClass(status))}>
                        {status ? status[0] : "—"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-green/30" /> Complete</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-amber/30" /> In Progress</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-bg-elevated" /> Not Started</span>
        </div>
      </motion.div>
    </div>
  );
}
