import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy de l'API en développement
      // 127.0.0.1 (et non "localhost") pour éviter la résolution IPv6 ::1
      // alors qu'uvicorn écoute en IPv4 en développement local.
      "/api": {
        target: process.env.VITE_API_TARGET ?? "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Gestion de Stock",
        short_name: "Stock",
        description: "Gestion de stock multi-magasins — Stock, Achats, Ventes",
        lang: "fr",
        theme_color: "#0d0a16",
        background_color: "#0d0a16",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: { cacheName: "api", networkTimeoutSeconds: 5 },
          },
        ],
      },
      // SW désactivé en dev (le PWA est validé via le build de production).
      // Évite aussi la dépendance à un crypto global (Node < 18.19).
      devOptions: { enabled: false },
    }),
  ],
});
