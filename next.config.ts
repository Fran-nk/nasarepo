import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Las pantallas se dibujan en el navegador (<SoloCliente>) porque dependen de datos
    // del celular (IndexedDB, fecha de hoy). Solo se valida "navegación instantánea"
    // en los segmentos que lo pidan con `export const instant`.
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
