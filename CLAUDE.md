# Orbita · Web

Orbita's web app (SvelteKit). Built from the same product as the Android app (`atm-orbita-android`), but with **three independent modules that do not exist on Android**:

1. **Receipts** (`/receipts`): recibos por honorarios. Tracks the gross amount issued against a configurable yearly cap (default S/ 50,000), with 8% withholding and net. A receipt can be filled in from SUNAT's XML (`src/lib/domain/rhe-xml.ts`).
2. **Loans** (`/loans`): money lent to other people, interest-free. Fixed monthly installment, first-installment month and payment day → schedule. Payments of any amount cover the installments oldest first. Each loan has a read-only public link (`/share/loans/[token]`).
3. **Services** (`/services`): monthly subscriptions (GitHub, Claude, Netflix…), with next charge, start date and total spent. A shared service has members, each with their own monthly amount and a start month; it shows who owes which months.

Plus: landing (`/`), login, register, forgot password (3 steps, like Android) and dashboard (`/dashboard`).

## Status (24 Oct 2026)

- **Mockups only**: everything runs on sample data in memory + `localStorage` (`src/lib/data/seed.ts`). There is **no connection to the API** yet, and nothing in `atm-orbita-api` or `atm-orbita-android` is touched from here.
- The demo session lets in any email and a password of 8+ characters.
- Receipt files (XML and optional PDF) are kept in the browser's IndexedDB through `src/lib/data/document-storage.ts`. Keys follow the R2 layout (`receipts/{receiptId}/{documentId}.{xml|pdf}`). With the API, that file becomes the Cloudflare R2 implementation: the API signs upload/download URLs and the browser never holds R2 credentials.
- The public loan link only works in the same browser for now (it reads the local demo data). With the API it will be a public endpoint by token.

## Language rule (non-negotiable)

- **Everything is in English**: code, identifiers, file and folder names, **URL routes**, query params, storage keys, comments, commits and docs for developers.
- **Only what the user sees is in Spanish (es-PE)**: texts, labels, messages, placeholders, page titles and sample data.
- Example: the route is `/receipts/new`, the button says "Nuevo recibo".

## Stack

- SvelteKit 3 + Svelte 5 (runes), TypeScript, SPA (`ssr = false`, `adapter-static` with `fallback: 'index.html'`).
- Tailwind CSS 4: design tokens in `src/routes/layout.css` (`@theme`), copied from Android (`ui/theme`, `ORBITA_SPEC §5`).
- Manrope font (`@fontsource-variable/manrope`), icons from `@lucide/svelte`.
- Vitest (domain rules), Playwright (installed, no e2e tests yet).

## Structure

```
src/lib/domain/       Pure rules (TS, no Svelte): money, dates, receipts, loans, services, rhe-xml. With tests (*.spec.ts).
src/lib/data/         Demo persistence (storage.ts), file storage (document-storage.ts) and sample data (seed.ts).
src/lib/stores/       State with runes (*.svelte.ts). The only place to swap for API calls.
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
7. If something is ambiguous, ask; don't make up business rules.

## Branches

- All work goes to **`develop`**. Moving to `main` is the user's call.
- Commits in Conventional Commits, in English, one per logical change.

## Commands

```bash
pnpm dev          # development
pnpm check        # types (svelte-check)
pnpm lint         # prettier + eslint
pnpm format       # format
npx vitest run --project server   # domain tests
pnpm build        # static build in build/
```
