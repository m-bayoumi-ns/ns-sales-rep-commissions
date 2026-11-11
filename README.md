# Sales Rep Commissions — عمولات المندوبين

Same stack, design, login and Odoo connection as **ns-payment-methods** (Next.js 16, Supabase Auth, next-intl en/ar,
light/dark). Pages: `/en/commissions` (`/en` and `/ar` open it) and `/en/settings` (administrators).

## Data (Odoo, read-only)
`lib/odoo/client.ts` refuses every call except `search_read`, `search_count`, `read`, `fields_get`, `read_group`.

| What | Where it comes from |
|---|---|
| Sales | Posted customer invoices and credit notes (`account.move`) whose **Salesperson** (`sales_rep_id`) is the rep, by invoice date. Product lines at their net amount after discount (`balance`); credit notes count negative. |
| Products / colours | `product.product` variants; the colour is the variant's `COLOR` attribute value. |
| Paid invoice sales | For invoices issued in the selected month, only the share of net sales proportional to amounts settled during that month counts, regardless of payment method. Partial payments count; later or earlier payments do not. |
| Collections | Same receipts as Customer Payments: posted customer payments − refunds (credited to the payment's **Commission Users**), money collected from incoming cheques on the day it landed (cheque's Commission Users, else the customer's salesperson), and treasury receipts entered as journal entries (customer's salesperson). |
| Receivables | Gross debt today of the customers whose salesperson is the rep (open month only). |

Group (sister) companies are excluded everywhere. Figures are cached 5 minutes for the open month (60 for closed months);
the page re-reads them every 5 minutes while it is open.

## Calculation (`lib/commissions/engine.ts`, unit-tested in `tests/engine.test.ts`)
1. Products classified as **slow-moving** or **digital** earn their category's configured commission rate
   (a colour-specific entry wins over "all colours"). All other invoice lines earn the rate of the **price range**
   (A / B / C) their unit price after discount falls in (`from ≤ price < to`). Slow-moving achievement and its
   per-rep monthly target are measured by sales value (EGP), not quantity.
2. **Target achievement** compares MTD sales with the monthly target prorated by elapsed calendar days while the month
   is open; closed months use the full target. Total, category and price-range targets follow the same rule:
   - below 50 % → 0.1 % of total sales, nothing else;
   - 50 % to under 70 % → **old system**: separate configurable unit-price tiers for regular products
     (slow-moving and digital products keep their category rates; Settings can instead use the current line tiers
     or a fixed % of sales);
   - 70 % and above → line commission + bonuses / deductions below.
3. + 20 % of the line commission when every target is met (total + each category that has a target);
   − 15 % when slow-moving achievement is under 60 %; + 2,000 when paid invoice sales ≥ 60 % of sales; + 2,000 when collections
   exceed 120 % of sales; + the monthly sales bonus (highest matching step of the ladder).
4. Collections ÷ sales, with no upper cap, is applied to the commission component (line commission, or the low / old
   replacement rate when that system applies). Bonuses and deductions are added afterward, unaffected by collections.
5. A note is flagged when month-end sales are below 478,000 (during the month: "at risk" when the projection is below it).

Every percentage, amount and step is editable per month in Settings.

## Storage (Supabase Storage, bucket `naguib-selim-db`)
- `ns-sales-rep-commissions/settings_YYYY_MM.json` — one file per month (rates, products, conditions, reps, targets).
  A month without a file starts from the latest earlier month (rates and rules only; targets are per month).
- `Wholesales_Target/target_YYYY_MM.xlsx` — read only. The **Sales Rep** column gives the month's reps; a "Target"
  column (and columns whose header mentions slow / راكد or digital / ديجيتال) prefill the targets.
  Each name is linked to an Odoo user automatically by name (codes like `NSR370_` are ignored); Settings can change it.

## Access (same `profiles` table as ns-home)
- super_admin: everything, Settings, Excel export.
- Users with `allowed_pages` including `sales-commissions` (or "Sales Commissions" / "عمولات المندوبين"):
  - `all_branches` → every rep;
  - `branch_filter_type = sales_rep` → only the reps named in their `sales_reps` (so each rep sees only themselves).

## Setup
```bash
npm install
npm run dev     # http://localhost:3000/en/commissions
npm test
```
`.env` holds the same values as ns-payment-methods. On Vercel use the same variables and add the new URL in
Supabase → Authentication → URL configuration. Local demo mode (`NS_DEMO_DATA=1` in `.env.development.local`)
skips the login and keeps settings / target files in a local `.data` folder instead of Supabase.

## Seller accounts
- Self-service registration is disabled. Administrators create seller accounts for reps listed in the latest target
  sheet (`Wholesales_Target/target_YYYY_MM.xlsx`) from **Accounts**. New accounts are written to the shared `profiles`
  table as `specific_branches` + `branch_filter_type = sales_rep` + `sales_reps = [sheet name]` +
  `allowed_pages = ["sales-commissions"]`, so a seller sees **only their own commission** (no team list, settings or
  accounts pages).
- **My account** (`/account`): change password (current password required).
- **Accounts** (`/accounts`, administrators): approve / disable seller accounts and switch on *Force new password*.
  The flag lives in the Auth user's `app_metadata.must_change_password`; at the next sign-in every page sends the
  seller to `/account` until the password is changed, then the flag switches itself off.

## Rate-change notifications
Saving the settings compares the rates and rules with the previous version. When something changed (or a message is
written) and "Notify" is set to all sellers or chosen accounts, a notification is stored in
`ns-sales-rep-commissions/notifications.json` and an empty ping is broadcast on the Supabase Realtime channel
`ns-commissions-notify`. Every open page listening on it fetches its own notifications at once (the bell in the header,
plus a toast); pages also re-check every 30 seconds. Read markers are in `notifications-read.json`.

## Mobile Applications

- **Android Native** (`android-native/`): Native Android Kotlin / Jetpack Compose application.
- **iOS Native** (`ios-native/`): 1:1 Native iOS Swift / SwiftUI application supporting iOS 16+, Face ID / Touch ID, RTL Arabic & LTR English, modern theme switcher, 4 commissions tabs, expandable search, and mandatory updates. Open `ios-native/NSCommissions.xcodeproj` in Xcode 15+.

