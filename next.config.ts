import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // "/en" and "/ar" open the commissions page.
  async redirects() {
    return [{ source: "/:locale(en|ar)", destination: "/:locale/commissions", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    // Equivalent of next-intl's `createNextIntlPlugin("./i18n/request.ts")` for Turbopack.
    // The plugin itself is not used: it eagerly loads @swc/core (only needed for its
    // experimental message extraction), whose native addon fails to load on this machine.
    resolveAlias: {
      "next-intl/config": "./i18n/request.ts",
    },
  },
};

export default nextConfig;
