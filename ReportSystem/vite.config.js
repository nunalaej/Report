// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",        // ok for Codespaces or LAN
    port: 5173,             // dev port
    proxy: {
      "/api": {
        target: "http://localhost:3000", // your Node server
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
