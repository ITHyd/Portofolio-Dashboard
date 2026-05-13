export function useChartTheme() {
  return {
    isDark: false,
    tick: { fill: "#4A4458", fontSize: 12 },
    smallTick: { fill: "#4A4458", fontSize: 10 },
    tooltip: {
      background: "#FFFFFF",
      border: "1px solid #E0D8E8",
      borderRadius: 14,
      color: "#030304",
      boxShadow: "0 12px 30px -24px rgba(3, 3, 4, 0.35)",
    } as React.CSSProperties,
  };
}
