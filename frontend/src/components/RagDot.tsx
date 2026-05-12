import { cn } from "@/lib/cn";

export function RagDot({ value, size = 10 }: { value?: string | null; size?: number }) {
  const color =
    value === "Green"
      ? "bg-rag-green shadow-[0_0_12px_rgba(16,185,129,0.55)]"
      : value === "Amber"
      ? "bg-rag-amber shadow-[0_0_12px_rgba(245,158,11,0.55)]"
      : value === "Red"
      ? "bg-rag-red shadow-[0_0_12px_rgba(239,68,68,0.55)] animate-pulse"
      : "bg-bg-border";
  return (
    <span
      className={cn("inline-block rounded-full", color)}
      style={{ width: size, height: size }}
      title={value ?? "—"}
    />
  );
}
