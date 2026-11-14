import type { MetadataRoute } from "next";

/**
 * Web app manifest.
 *  - iPhone (and any browser): "Add to Home Screen" installs the site as an app — own icon, full screen,
 *    and web push notifications (iOS 16.4+), see lib/app/push.ts and public/sw.js.
 *  - `related_applications` lets Chrome on Android check whether the Android WebView app is installed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NS Commissions",
    short_name: "NS Commissions",
    description: "Sales rep commissions · Naguib Selim",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#4a2d16",
    theme_color: "#4a2d16",
    icons: [
      { src: "/brand/icon-192-v2.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/splash-ns-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-v2.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    related_applications: [{ platform: "play", id: "com.naguibselim.commissions", url: "https://ns-scw.bayoumi.dev/ar/get-app" }],
    prefer_related_applications: false,
  };
}
