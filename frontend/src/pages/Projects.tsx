import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

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
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function Projects() {
  const [rows, setRows] = useState<Project[]>([]);
  useEffect(() => {
    api.get<Project[]>("/projects").then((r) => setRows(r.data));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-xl">Project Register</h1>
          <p className="text-sm text-ink-muted">{rows.length} projects</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card overflow-x-auto p-5"
      >
        <table className="w-full min-w-[1280px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
              <th className="pb-2 pr-3">Ref</th>
              <th className="pb-2 pr-3">Project</th>
              <th className="pb-2 pr-3">Client</th>
              <th className="pb-2 pr-3">Sub-Proposition / Practice</th>
              <th className="pb-2 pr-3">Phase</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Start</th>
              <th className="pb-2 pr-3">End (Baseline)</th>
              <th className="pb-2 pr-3">End (Forecast)</th>
              <th className="pb-2 pr-3">PM</th>
              <th className="pb-2">CP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const slipped =
                p.end_date_baseline &&
                p.end_date_forecast &&
                new Date(p.end_date_forecast) > new Date(p.end_date_baseline);
              return (
                <tr key={p.id} className="border-t border-bg-border/60">
                  <td className="py-2 pr-3 text-ink-muted">{p.ref ?? "—"}</td>
                  <td className="py-2 pr-3 text-ink">{p.name}</td>
                  <td className="py-2 pr-3 text-ink-muted">{p.client}</td>
                  <td className="py-2 pr-3 text-ink-muted">{p.sub_proposition ?? "—"}</td>
                  <td className="py-2 pr-3 text-ink-muted">{p.phase ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        p.status === "Active"
                          ? "chip-green"
                          : p.status === "On Hold"
                          ? "chip-amber"
                          : p.status === "Closed"
                          ? "chip-muted"
                          : "chip-muted"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-ink-muted">{fmtDate(p.start_date)}</td>
                  <td className="py-2 pr-3 text-ink-muted">{fmtDate(p.end_date_baseline)}</td>
                  <td
                    className={
                      "py-2 pr-3 " + (slipped ? "text-rag-amber" : "text-ink-muted")
                    }
                    title={slipped ? "Forecast end is later than baseline" : undefined}
                  >
                    {fmtDate(p.end_date_forecast)}
                  </td>
                  <td className="py-2 pr-3 text-ink-muted">{p.pm_name ?? "—"}</td>
                  <td className="py-2 text-ink-muted">{p.cp_name ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
