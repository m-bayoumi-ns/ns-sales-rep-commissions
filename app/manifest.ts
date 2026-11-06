import type { MetadataRoute } from "next";

/**
 * Web app manifest. `related_applications` lets Chrome on Android tell the page whether the
 * NS Commissions app is installed (navigator.getInstalledRelatedApps), so the phone banner can say
 * "Open" instead of "Download". The app links back with its asset_statements (AndroidManifest.xml).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NS Commissions",
    short_name: "NS Commissions",
    start_url: "/",
    display: "browser",
    background_color: "#f6f5f3",
    theme_color: "#744c27",
    icons: [{ src: "/brand/app-icon.png", sizes: "192x192", type: "image/png" }],
    related_applications: [{ platform: "play", id: "com.naguibselim.commissions", url: "https://ns-sales-rep-commissions.vercel.app/get-app" }],
    prefer_related_applications: false,
  };
}
