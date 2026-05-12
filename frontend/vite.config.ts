import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    proxy: {
      // In dev, backend is exposed on host port 8022 (per docker-compose).
      "/api": "http://localhost:8022",
    },
  },
});
