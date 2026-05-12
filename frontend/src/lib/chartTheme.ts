import { useTheme } from "@/store/theme";

export function useChartTheme() {
  const theme = useTheme((s) => s.theme);
  const isDark = theme === "dark";
  return {
    isDark,
    tick: { fill: isDark ? "#94A3B8" : "#475569", fontSize: 12 },
    smallTick: { fill: isDark ? "#94A3B8" : "#475569", fontSize: 10 },
    tooltip: {
      background: isDark ? "#101633" : "#FFFFFF",
      border: `1px solid ${isDark ? "#262F5A" : "#E2E8F0"}`,
      borderRadius: 8,
      color: isDark ? "#E2E8F0" : "#0F172A",
      boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.45)" : "0 8px 18px rgba(15,23,42,0.10)",
    } as React.CSSProperties,
  };
}
