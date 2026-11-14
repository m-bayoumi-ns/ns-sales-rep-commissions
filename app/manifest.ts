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
    // Launch screen on Android must be plain brown, no logo. Chrome builds it from the manifest icons:
    // newer phones take the *maskable* icon closest to 128dp, the home-screen icon takes the maskable
    // closest to 83dp (each picks the smallest icon at least that big). So:
    //   - 333px maskable = the real NS icon: big enough for the home screen (83dp is <= 332px even at 4x),
    //     smaller than the splash target on 2.625x+ screens (128dp >= 336px) — so it never reaches the splash.
    //   - 512px maskable = solid splash brown: what the launch screen picks, i.e. nothing visible.
    //   - Older phones use "any" icons for the splash: the 512px transparent one, again nothing visible.
    icons: [
      { src: "/brand/icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/splash-clear-v3.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-333.png", sizes: "333x333", type: "image/png", purpose: "maskable" },
      { src: "/brand/splash-blank-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    related_applications: [{ platform: "play", id: "com.naguibselim.commissions", url: "https://ns-scw.bayoumi.dev/ar/get-app" }],
    prefer_related_applications: false,
  };
}
