import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
const baseNoSlash = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      base: basePath,
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        navigateFallback: `${baseNoSlash}/offline.html`,
        navigateFallbackDenylist: [/\/api\//, /\/sign-in/, /\/sign-up/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "html-cache", networkTimeoutSeconds: 10 },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: { cacheName: "image-cache", expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
        ],
      },
      manifest: {
        name: "ISC Mbujimayi — Plateforme Académique",
        short_name: "ISC Mbujimayi",
        description: "Plateforme e-learning et de gestion académique de l'Institut Supérieur de Commerce Mbujimayi",
        theme_color: "#1a3c6e",
        background_color: "#f5f7fa",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: `${baseNoSlash}/`,
        scope: `${baseNoSlash}/`,
        lang: "fr",
        icons: [
          { src: `${baseNoSlash}/images/icon-72x72.png`, sizes: "72x72", type: "image/png" },
          { src: `${baseNoSlash}/images/icon-96x96.png`, sizes: "96x96", type: "image/png" },
          { src: `${baseNoSlash}/images/icon-128x128.png`, sizes: "128x128", type: "image/png" },
          { src: `${baseNoSlash}/images/icon-144x144.png`, sizes: "144x144", type: "image/png" },
          { src: `${baseNoSlash}/images/icon-152x152.png`, sizes: "152x152", type: "image/png" },
          { src: `${baseNoSlash}/images/icon-192x192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
          { src: `${baseNoSlash}/images/icon-384x384.png`, sizes: "384x384", type: "image/png" },
          { src: `${baseNoSlash}/images/icon-512x512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        categories: ["education", "productivity"],
      },
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
