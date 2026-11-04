# Developer Handover Guide

This repository contains the Next.js SaaS codebase for **Skool Video Downloader**. The project has been fully configured for local development, visual design, and payment flows.

---

## 🛠️ Tech Stack & Database Setup

1. **Next.js & React:** Next.js App Router (v14.2) styled with custom premium vanilla CSS modules and shared utility files.
2. **Database (MongoDB):**
   * Hosted on **MongoDB Atlas**, accessed via the native `mongodb` driver (no ORM).
   * Connection singleton: [mongodb.ts](src/lib/mongodb.ts). Typed collection helpers: [db.ts](src/lib/db.ts).
   * Collections: `users`, `subscriptions`, `licenseKeys`, `anonymousDevices`, `contactMessages`.
   * Connection string: `MONGODB_URI` in `.env`.
   * Indexes are **not** auto-created on server start (that used to run on every cold start, adding latency to the extension's download-status check specifically). Run `npm run db:ensure-indexes` once after cloning/deploying, and again any time the schema in `db.ts` changes.
3. **Authentication (NextAuth.js):**
   * Configured in [auth.ts](src/lib/auth.ts).
   * Email + password only, via a **CredentialsProvider** backed by MongoDB (bcrypt-hashed passwords). No Google/social login.
   * Sign-up (first/last name, email, optional mobile, country, password) goes through `/api/auth/signup`, which writes directly to the `users` collection.

---

## 🔑 Accounts & Admin Access

There are no seeded test accounts anymore — sign up for a real account at `/login` (toggle to "Sign up"), which writes a bcrypt-hashed user record to MongoDB.

`/admin` is a **separate** login system from the regular site, defined in [admin-auth.ts](src/lib/admin-auth.ts) — a single username/password pair checked against `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (a bcrypt hash) in `.env`, backed by a signed, stateless session cookie (`ADMIN_SESSION_SECRET`). It is not tied to any MongoDB user account. Log in at `/admin/login`.

---

## 🚀 Key Pages & Layout Structures

* **Blog & Guides (`/blog`):** Modern layout featuring hero section, featured article spotlight, category tags, and dynamic grid listings.
* **User Dashboard (`/dashboard`):** Premium dark mode user portal. Displays subscription metrics, link indicators for Skool & Loom Chrome extension video downloaders, dynamic Dodo Payments pricing cards (for Free accounts), and a direct link to the Dodo billing portal.
* **Admin Overview (`/admin`):** Separately-authenticated (`/admin/login`) dashboard tracking total users, active subscribers, lifetime vs. monthly purchase counts, a full buyer list (email/plan/license key), and every free-tier user's remaining download count.
* **Publish Manager (`/admin/publish`):** Custom visual markdown authoring dashboard for creating and publishing articles as markdown files under `content/blog/`.
* **Static Content & Utilities:** Standardized footer, contact page, privacy policies, terms, refund forms, and thank-you templates.

---

## 💳 Checkout & Dodo Payments Integration

* **Checkout Endpoint:** [route.ts](file:///Users/ishara/Desktop/codes/skool%20final%20home/src/app/api/checkout/route.ts) receives the plan ID and email, calling the Dodo Payments SDK to generate checkout session redirects.
* **Webhook Handler:** [route.ts](file:///Users/ishara/Desktop/codes/skool%20final%20home/src/app/api/webhooks/dodopayments/route.ts) listens for Dodo's real events (confirmed against the dashboard's event catalog): `payment.succeeded` (lifetime one-time purchase), `subscription.active`/`subscription.renewed` (monthly), `subscription.cancelled`/`expired`/`failed`, `subscription.on_hold`/`paused`, `refund.succeeded`, and `dispute.opened` — to synchronize subscriber tiers. The original code listened for `checkout.succeeded`, which is not a real Dodo event and never fired; this was a live bug (purchases never granted access) fixed alongside the webhook security hardening.
* **Billing Portal:** Integrates Dodo's customer self-service hub (`customer.dodopayments.com`) for direct user invoice management.
* **⚠️ `DODO_PAYMENTS_WEBHOOK_SECRET` is required.** The webhook route fails closed (returns 503, processes nothing) if this isn't set in `.env` — copy the signing secret from your Dodo dashboard's webhook settings. Without it, checkouts will complete on Dodo's side but no license key/subscription will ever be created, since the endpoint refuses to run.
* The webhook is idempotent (dedupes by Dodo's payment/subscription id, stored as `dodoId` on the license key). **The `event.data` field names (`customer_email`, `product_id`, `id`) are still an educated guess, not confirmed against a real payload** — the handler logs the raw `event.data` on every purchase event specifically so this can be verified after the first real test purchase of each plan. Check the server logs (or send them over) once you've done one.
* Dodo also has its own native `license_key.*` and `entitlement_grant.*` events, suggesting the platform may offer built-in license-key delivery — worth investigating as a possible replacement for the custom `licenseKeys` collection/generation logic here, though that's a separate decision, not something changed as part of this fix.

### Admin actions (`/admin`)
Beyond the read-only stats, the admin panel can now: revoke/reactivate a license key (also flips the customer's subscription status), reset a user's password (shows a one-time temporary password for you to relay manually — there's no self-serve "forgot password" since no transactional email provider is wired up), and view/mark-read contact form submissions (stored in the `contactMessages` collection — the form no longer discards them).

---

## 💻 Running Locally

1. Create a `.env` file in the root directory:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<generate with: openssl rand -hex 32>
   MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skoolvideosaver?appName=Cluster0"
   ADMIN_USERNAME=youradminusername
   ADMIN_PASSWORD_HASH=<bcrypt hash — generate with: node -e "console.log(require('bcryptjs').hashSync('yourpassword', 12))">
   ADMIN_SESSION_SECRET=<any long random string>
   ```
   Note: bcrypt hashes contain `$` characters, which Next.js's env loader treats as variable-expansion syntax — escape every `$` as `\$` in `ADMIN_PASSWORD_HASH` or the hash will be silently mangled.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the server:
   ```bash
   pnpm dev
   ```
   No migration/generate step is needed — MongoDB collections are created on first write.
