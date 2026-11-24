import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_URL } = loadEnv(mode, process.cwd(), "VITE_");
  return {
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
      proxy: {
        "^/api/auth/(google|refresh|logout)$": {
          target: (VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, ""),
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
