# NS Commissions — native Android app · تطبيق عمولات المندوبين

A native Android app (Kotlin + Jetpack Compose, no WebView) for the **Commissions** page of this repository's website.
It shows the same figures, uses the same accounts and permissions, and runs the same calculation, because the
calculation stays on the server. The WebView app in [`../android`](../android) is separate and unchanged.

## How it works

```
Phone (this app)  ──HTTPS──▶  ns-sales-rep-commissions (Next.js on Vercel)  ──▶  Odoo (read-only) + Supabase
```

The phone never holds the Odoo or Supabase keys. It talks only to three JSON endpoints on the website:

| Endpoint | What it does |
|---|---|
| `POST /api/app/session` `{identifier, password}` | Sign-in. Same rules as the website form: email, seller username (`nsr305`) or sheet name; 5 failures → 10-minute pause; activity log; sign-in alert on the user's other devices. Returns the Supabase session tokens. |
| `POST /api/app/session/refresh` `{refreshToken}` | Swaps the refresh token for a new session before the access token expires. |
| `GET /api/app/commissions?month=YYYY-MM&rep=<key\|all>` | The Commissions page as JSON (`Authorization: Bearer <access token>`). Same `getCommissionsView` and the same access rules as `/commissions`. |

The tokens are stored encrypted on the phone (`EncryptedSharedPreferences`, Android Keystore).

## Screens

- **Sign in**: email or username plus password, with a link to the website's seller registration.
- **Commissions**: month and seller pickers, live / closed state, and notices (no rates, inherited rates, missing sheet, unlinked reps).
  - **Team summary** (managers): team sales, commission, collections, reps on track, reps below minimum, then a ranked card per rep.
  - **Statement** (one seller, the default view and the only one a seller sees):
    - commission and the system that applies
    - targets: total, prorated to date, projection, needed per day, slow-moving / digital / range targets
    - how the commission is built (every bonus and deduction and how close the rep is)
    - daily sales chart against the target pace
    - commission by price range and category
    - collections and receivables
    - products (searchable), invoices and credit notes, customers
- Pull to refresh. Figures reload every 5 minutes while the app is open, and when you come back to it after 5 minutes away.
- English / Arabic (RTL) follow the phone's language; on Android 13+ you can also pick it per app in system settings. Light and dark follow the phone.

## Project layout

```
app/src/main/java/com/naguibselim/commissionsapp/
  MainActivity.kt            splash, theme, sign-in ↔ commissions
  data/Api.kt                HTTP client, token refresh
  data/Models.kt             JSON models (mirror lib/commissions/view.ts + engine.ts)
  data/SessionStore.kt       encrypted token storage
  ui/AppViewModel.kt         state: sign-in, month, seller, loading, errors
  ui/LoginScreen.kt
  ui/CommissionsScreen.kt    top bar, filters, notices, team summary
  ui/RepDetail.kt            the seller statement
  ui/Components.kt, Theme.kt shared UI, brand colours
  util/Format.kt             numbers, money, months (ar-EG / en-US)
```

## Build

**GitHub Actions** ([`.github/workflows/android-native-apk.yml`](../.github/workflows/android-native-apk.yml)): every push to
`main` that changes `android-native/` builds a release APK (or run it by hand from the Actions tab). The APK is published as
a GitHub Release (`app-v1.0.<run>`) and uploaded as a workflow artifact. It is signed with the same `ANDROID_*` secrets as the
WebView app. A repository variable `API_BASE_URL` can override the website address
(default `https://ns-sales-rep-commissions.vercel.app`).

**Android Studio**: open the `android-native` folder. It downloads Gradle 8.7 and the Android SDK on first sync. Run the `app`
configuration.

The application id is `com.naguibselim.commissionsapp`, so the app installs next to the WebView app
(`com.naguibselim.commissions`) instead of replacing it.

## Server side

The endpoints are part of the website in this repository:

- [`app/api/app/session/route.ts`](../app/api/app/session/route.ts)
- [`app/api/app/session/refresh/route.ts`](../app/api/app/session/refresh/route.ts)
- [`app/api/app/commissions/route.ts`](../app/api/app/commissions/route.ts)
- [`lib/auth/bearer.ts`](../lib/auth/bearer.ts) (Bearer-token session read)
- [`lib/app/session.ts`](../lib/app/session.ts) (helpers)

When `lib/commissions/view.ts` or `engine.ts` changes the shape of the data, update `data/Models.kt` in the same commit.
