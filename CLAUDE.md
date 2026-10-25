# Orbita · Web

Orbita's web app (SvelteKit). Built from the same product as the Android app (`atm-orbita-android`), but with **three independent modules that do not exist on Android**:

1. **Receipts** (`/receipts`): recibos por honorarios. Tracks the gross amount issued against a configurable yearly cap (default S/ 50,000), with 8% withholding and net. A receipt can be filled in from SUNAT's XML (`src/lib/domain/rhe-xml.ts`).
2. **Loans** (`/loans`): money lent to other people, interest-free. Debtor-first local prototype: create a person by name and a fixed currency (PEN by default), add advances, and record flexible repayments with dates. Each debtor has one immutable currency; another currency requires another debtor record, even with the same name. Advances and payments use that currency. Each advance can have a manually edited distribution by month (YYYY-MM), allowing partial plans and different amounts. Each new repayment explicitly selects the month it covers, independently from its received date. Monthly expected/paid/remaining/surplus totals never move excess payments to another month automatically. The read-only route (`/share/loans/[token]`) is a same-browser preview, not a remotely shareable link.
3. **Services** (`/services`): monthly subscriptions (GitHub, Claude, Netflix…), with next charge, start date and total spent. A shared service has members, each with their own monthly amount and a start month; it shows who owes which months.

Plus: landing (`/`), login, register, forgot password (3 steps, like Android) and dashboard (`/dashboard`).

## Status (24 Oct 2026)

| Part                              | State                                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Login, register, forgot password  | **Real**, against `atm-orbita-api` (the same accounts as the Android app; plans 01, 11 and 17 of the API) |
| Receipts (`/receipts`)            | **Real**: data in the API's database, XML and PDF in Cloudflare R2 (API plan 18)                          |
| Loans, services, public loan link | Loans/public loan links are **mockups** in localStorage; services are **real**, against the API (plan 20) |
| Dashboard                         | Receipts and services real; loans from the mockups                                                        |

- **Session:** the access token lives only in memory (`src/lib/api/client.ts`); the refresh token is an `HttpOnly`, `SameSite=Strict` cookie that JavaScript never sees (header `X-Session-Transport: cookie`, API plan 17). On load, the app renews the session and asks `/me` (`session.ensureReady()`); a 401 renews once and retries. New web sessions use 90-day renewable refresh tokens (API `WEB_REFRESH_TOKEN_TTL_DAYS`); existing/native sessions keep their policy. Web Locks serialize cookie rotations across tabs.
- **Loans:** mockup only; no loan API or database writes. Versioned localStorage key `orbita:loan-debtors-v3` preserves previous records from `orbita:loan-debtors-v2` (splitting mixed-currency people) and legacy `orbita:loans` (grouped by normalized name and currency), without deleting the original keys. Editing/removing movements validates the chronological balance for each currency. Monthly plans and applied payment months are optional additive fields for existing records. Previous repayments remain unassigned until manually edited, while already reducing the overall balance. Old day-based payment references are displayed only as a month-based historical hint; they never create a plan.
- **Services:** real API persistence for subscriptions, members and monthly reimbursement payments (API plan 20). No categories or automatic equal split. Currency uses an animated radio switch and is locked after payments exist. Day/date controls use Bits UI popovers/calendar; date-only values use `@internationalized/date`. The store clears on session loss and uses the profile-local date from API metadata. Removing members/sharing also removes their payments. Historical payment amounts stay fixed.
- **Files:** uploaded through the API (it checks them), downloaded with short-lived signed R2 URLs, and shown inside the page through `…/documents/:kind/content` (the R2 key cannot set CORS on the bucket; see API plan 18, deviations).
- **Google sign-in:** login/register use Google Identity Services when the API returns a configured client ID from `/auth/google/config` (API plan 19). Google credentials stay in memory. An existing password account confirms its password once to link. The API supplies all provider configuration; no frontend `.env` or build arguments. Live account testing requires the owner’s OAuth web client ID. See `../atm-orbita-api/docs/plans/19-google-sign-in.md` for setup and deployment.
- **Register asks for a name** (optional in the API, so Android keeps working without it).

## Running it locally

Web and API run on this machine; only the database is on the VPS, through an SSH tunnel.

```bash
ssh -N -L 15432:127.0.0.1:5432 atmosfera      # 1. tunnel to the VPS database (leave it open)
cd ../atm-orbita-api && scripts/dev.sh         # 2. API on http://localhost:3071 (reads its .env)
pnpm dev                                       # 3. web on http://localhost:5173
```

Vite proxies `/api` to the API (`API_PROXY_TARGET`, default `http://localhost:3071`), so the browser sees one origin: the session cookie is first-party and no CORS is needed. Migrations of the server database are applied from the API with `scripts/dev.sh migrate up`.

## Language rule (non-negotiable)

- **Everything is in English**: code, identifiers, file and folder names, **URL routes**, query params, storage keys, comments, commits and docs for developers.
- **Only what the user sees is in Spanish (es-PE)**: texts, labels, messages, placeholders, page titles and sample data.
- Example: the route is `/receipts/new`, the button says "Nuevo recibo".

## Stack

- SvelteKit 3 + Svelte 5 (runes), TypeScript, SPA (`ssr = false`, `adapter-static` with `fallback: 'index.html'`).
- Tailwind CSS 4: design tokens in `src/routes/layout.css` (`@theme`), copied from Android (`ui/theme`, `ORBITA_SPEC §5`).
- Manrope font (`@fontsource-variable/manrope`), icons from `@lucide/svelte`.
- Vitest (domain rules), Playwright (used for end-to-end checks against the local API).

## Structure

```
src/lib/api/          API client (client.ts: tokens, renewal, errors), auth.ts, receipts.ts; errors.ts maps codes to Spanish.
src/lib/domain/       Pure rules (TS, no Svelte): money, dates, receipts, loans, services, rhe-xml. With tests (*.spec.ts).
src/lib/data/         Mockup persistence (storage.ts) and sample data for loans (seed.ts).
src/lib/stores/       State with runes (*.svelte.ts). session, receipts and services talk to the API; loans are mockups.
src/lib/components/
  ui/                 Reusable design-system components (Button, Card, TextField, Modal, HeroCard…).
  layout/             AppShell (sidebar on desktop, bottom bar on mobile), UserMenu, FloatingCards.
  documents/          File slot, viewer (PDF embedded, XML formatted) and download helpers.
  receipts|loans|services/  Components for each module.
src/routes/
  (auth)/             login, register, forgot-password (redirect to /dashboard if a session exists).
  (app)/              dashboard, receipts, loans, services (redirect to /login without a session).
  share/loans/[token] Public read-only loan page.
```

## Rules that stay fixed

1. **Money = integer cents** (`Cents`). Never floats. Parse with `parseAmount`, show with `formatMoney` (`S/ 1,245.80`, `US$ 250.00`, minus sign U+2212).
2. Dates as text: days `YYYY-MM-DD`, months `YYYY-MM` (`src/lib/domain/dates.ts`). Formats like Android: `2 oct 2026`, `Septiembre 2026`.
3. Business rules live in `src/lib/domain` and are tested; components only display data.
4. Validation messages: the first problem only, same style as Android (`ORBITA_SPEC §4.1`).
5. Links with `resolve()` from `$app/paths` using **route IDs with the group**: `resolve('/(app)/loans/[id]', { id })`.
6. Imports through `#lib/...` **with the extension**: `#lib/domain/money.ts`, `#lib/stores/loans.svelte.ts`.
7. Error texts come from the API's `code` (`messageFor` in `src/lib/api/errors.ts`), never from its `message`.
8. If something is ambiguous, ask; don't make up business rules.

## Branches and deploy

| Branch       | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| `develop`    | All the work.                                                                 |
| `main`       | What already works, promoted from `develop`.                                  |
| `production` | Pushing here runs `.github/workflows/deploy.yml` and publishes to the server. |

The flow is always `develop` → `main` → `production`, and **promoting is the user's call**. The workflow refuses a commit that is not in `main`. Commits in Conventional Commits, in English, one per logical change.

The workflow has three jobs: **check** (lint, types, tests, build), **build-and-push** (the image is built in GitHub and published to `ghcr.io/atmosferasoltec/atm-orbita-web`, never on the server) and **deploy** (copies `deploy/docker-compose.yml` to `/opt/orbita-web` and starts the new image, waiting for it to be `healthy`). It uses the repo secrets `SSH_HOST`, `SSH_USER` and `SSH_KEY`.

On the server (`ssh atmosfera`):

- `https://orbita.atmosferast.com` → host nginx (`/etc/nginx/sites-available/orbita.atmosferast.com`, wildcard origin certificate) → container `orbita-web` on `127.0.0.1:3070`.
- The container is nginx serving the static build and forwarding `/api` to the `orbita-api` container over `atm-network` (`deploy/nginx.conf`). One origin: the session cookie is first-party and no CORS is needed.
- `/opt/orbita-web` belongs to the `deploy` user. **There is no `.env`**: the web has no configuration or secrets.
- **The web needs the API deployed with the receipts module** (`atm-orbita-api`, plans 17 and 18); promote the API first.
- Rollback: rerun the workflow (`workflow_dispatch`) on an older commit, or on the server `cd /opt/orbita-web && IMAGE_TAG=sha-<older> docker compose up -d`.

## Commands

```bash
pnpm dev          # development
pnpm check        # types (svelte-check)
pnpm lint         # prettier + eslint
pnpm format       # format
npx vitest run --project server   # domain tests
pnpm exec playwright test         # Google (mock) and services (real local API/server DB)
pnpm build        # static build in build/
```
