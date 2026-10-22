import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: "room-invite-network-origin",
    apply: "serve",
    transformIndexHtml(_html, context) {
      const networkUrl = context.server?.resolvedUrls?.network[0];
      return networkUrl ? [{
        tag: "meta",
        attrs: { name: "room-invite-network-origin", content: new URL(networkUrl).origin },
        injectTo: "head",
      }] : [];
    },
  }],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
