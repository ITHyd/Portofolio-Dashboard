import { useEffect, useState } from "react";
import { Info, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { useHScroll } from "@/lib/useHScroll";

interface Resource {
  id: number;
  code: string | null;
  name: string;
  practice: string | null;
  region: string | null;
  contract_hours_per_week: number | null;
}

interface Week {
  id?: number;
  resource_id: number;
  week_ending: string;
  leave_hrs: number | null;
  billable_hrs: number | null;
  non_billable_hrs: number | null;
  utilisation_pct: number | null;
  assigned_project_refs: string | null;
  assignment_status: string | null;
}

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

export function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [rows, setRows] = useState<Record<number, Week>>({});
  const [week, setWeek] = useState(thisFriday());
  const scrollRef = useHScroll<HTMLDivElement>();

  useEffect(() => {
    api.get<Resource[]>("/resources").then((r) => setResources(r.data));
  }, []);

  useEffect(() => {
    api.get<Week[]>("/resources/weeks", { params: { week_ending: week } }).then((r) => {
      const map: Record<number, Week> = {};
      r.data.forEach((x) => (map[x.resource_id] = x));
      setRows(map);
    });
  }, [week]);

  function patch(rid: number, p: Partial<Week>) {
    setRows((s) => {
      const existing: Week = s[rid] ?? {
        resource_id: rid,
        week_ending: week,
        leave_hrs: null,
        billable_hrs: null,
        non_billable_hrs: null,
        utilisation_pct: null,
        assigned_project_refs: null,
        assignment_status: null,
      };
      return { ...s, [rid]: { ...existing, ...p } };
    });
  }

  async function save(rid: number) {
    await api.post("/resources/weeks", { ...rows[rid], resource_id: rid, week_ending: week });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-2">
          <UsersRound size={16} className="text-ink-muted" />
          <h1 className="font-display text-xl">Resource & Utilisation</h1>
          <InfoHint text="Track weekly leave, billable and non-billable hours, utilisation, assignments, and bench status across the resource pool." />
        </div>
        <div>
          <label className="label">Week ending</label>
          <input type="date" className="input w-44" value={week} onChange={(e) => setWeek(e.target.value)} />
        </div>
      </div>
      <div ref={scrollRef} className="card overflow-x-auto p-5">
        <table className="w-full min-w-[1250px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-subtle">
              <th className="pb-3 pr-4 whitespace-nowrap" title="Resource name.">Name</th>
              <th className="pb-3 pr-4 whitespace-nowrap" title="Practice, capability, or function the resource belongs to.">Practice</th>
              <th className="pb-3 pr-4 whitespace-nowrap" title="Primary geography or delivery region for the resource.">Region</th>
              <th className="pb-3 pr-4 whitespace-nowrap" title="Leave hours recorded for the selected week.">Leave</th>
              <th className="pb-3 pr-4 whitespace-nowrap" title="Billable delivery hours recorded for the selected week.">Billable</th>
              <th className="pb-3 pr-4 whitespace-nowrap" title="Non-billable hours recorded for the selected week.">Non-billable</th>
              <th className="pb-3 pr-4 whitespace-nowrap" title="Utilisation percentage for the selected week.">Util %</th>
              <th className="pb-3 pr-4 whitespace-nowrap" title="Assigned project references for the selected week.">Assigned</th>
              <th className="pb-3 pr-4 whitespace-nowrap" title="Current assignment state such as assigned, part-assigned, or bench.">Status</th>
              <th className="pb-3" title="Save weekly resource values for this row."></th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => {
              const w = rows[r.id];
              return (
                <tr key={r.id} className="border-t border-bg-border/60">
                  <td className="py-3 pr-4 text-ink whitespace-nowrap">{r.name}</td>
                  <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{r.practice ?? "-"}</td>
                  <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{r.region ?? "-"}</td>
                  {(["leave_hrs", "billable_hrs", "non_billable_hrs"] as const).map((f) => (
                    <td key={f} className="py-3 pr-4">
                      <input type="number" className="input w-24" value={(w?.[f] as number | null) ?? ""} onChange={(e) => patch(r.id, { [f]: e.target.value === "" ? null : Number(e.target.value) } as never)} />
                    </td>
                  ))}
                  <td className="py-3 pr-4">
                    <input type="number" step="0.01" className="input w-24" value={w?.utilisation_pct ?? ""} onChange={(e) => patch(r.id, { utilisation_pct: e.target.value === "" ? null : Number(e.target.value) })} />
                  </td>
                  <td className="py-3 pr-4">
                    <input className="input w-36" value={w?.assigned_project_refs ?? ""} onChange={(e) => patch(r.id, { assigned_project_refs: e.target.value })} />
                  </td>
                  <td className="py-3 pr-4">
                    <select className="input w-36" value={w?.assignment_status ?? ""} onChange={(e) => patch(r.id, { assignment_status: e.target.value || null })}>
                      <option value="">-</option>
                      <option>Assigned</option>
                      <option>Part-assigned</option>
                      <option>Bench</option>
                    </select>
                  </td>
                  <td className="py-3"><button className="btn-primary" onClick={() => save(r.id)}>Save</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
