import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

type ImportCounts = {
  projects_inserted: number;
  projects_updated: number;
  weekly_status_upserted: number;
  risks_issues_inserted: number;
  csat_inserted: number;
  resources_inserted: number;
  resource_weeks_upserted: number;
};

interface Result {
  ok: boolean;
  message: string;
  counts?: ImportCounts;
}

export function ImportButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const role = useAuth((s) => s.user?.role);
  const allowed = role === "portfolio_office" || role === "admin";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post("/imports/portfolio-register", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const c: ImportCounts = data.counts;
      const total =
        c.projects_inserted +
        c.projects_updated +
        c.weekly_status_upserted +
        c.risks_issues_inserted +
        c.csat_inserted +
        c.resources_inserted +
        c.resource_weeks_upserted;
      setResult({
        ok: true,
        counts: c,
        message: `Imported ${total} rows from ${data.filename}`,
      });
      setTimeout(() => window.location.reload(), 1800);
    } catch (err: any) {
      setResult({
        ok: false,
        message: err?.response?.data?.detail ?? "Import failed",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!allowed) return null;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx"
        hidden
        onChange={handleFile}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="btn-ghost"
        title="Upload Portfolio Register (.xlsx)"
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Upload size={14} />
        )}
        <span className="hidden sm:inline">{busy ? "Importing..." : "Import"}</span>
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="fixed right-6 top-20 z-50 max-w-sm"
            onAnimationComplete={() => {
              if (result?.ok) return;
              setTimeout(() => setResult(null), 5000);
            }}
          >
            <div
              className={`card flex items-start gap-3 p-4 ${
                result.ok ? "border-rag-green/40" : "border-rag-red/40"
              }`}
            >
              {result.ok ? (
                <CheckCircle2 size={18} className="mt-0.5 text-rag-green" />
              ) : (
                <XCircle size={18} className="mt-0.5 text-rag-red" />
              )}
              <div className="text-sm">
                <div className="font-medium text-ink">{result.message}</div>
                {result.counts && (
                  <div className="mt-1 space-y-0.5 text-xs text-ink-muted">
                    {result.counts.projects_inserted > 0 && (
                      <div>+ {result.counts.projects_inserted} new projects</div>
                    )}
                    {result.counts.projects_updated > 0 && (
                      <div>Updated {result.counts.projects_updated} projects</div>
                    )}
                    {result.counts.weekly_status_upserted > 0 && (
                      <div>Updated {result.counts.weekly_status_upserted} weekly status rows</div>
                    )}
                    {result.counts.risks_issues_inserted > 0 && (
                      <div>+ {result.counts.risks_issues_inserted} risks/issues</div>
                    )}
                    {result.counts.csat_inserted > 0 && (
                      <div>+ {result.counts.csat_inserted} CSAT entries</div>
                    )}
                    {result.counts.resources_inserted > 0 && (
                      <div>+ {result.counts.resources_inserted} resources</div>
                    )}
                    {result.counts.resource_weeks_upserted > 0 && (
                      <div>Updated {result.counts.resource_weeks_upserted} resource-week rows</div>
                    )}
                    <div className="pt-1 text-ink-subtle">Refreshing...</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
