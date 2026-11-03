# Orbita · Web

Web app for Orbita, with the same accounts as the Android app. **Receipts (recibos por honorarios)** against the yearly cap, with their XML and PDF, work against the real API; **shared services** now persist subscriptions, members and payments through the API; **loans** remain mockups with sample data.

```bash
pnpm install
ssh -N -L 15432:127.0.0.1:5432 atmosfera        # database on the VPS
(cd ../atm-orbita-api && scripts/dev.sh)        # API on :3071
pnpm dev                                        # web on :5173
```

Sample XML to try the upload: `src/lib/domain/fixtures/rhe-sample.xml`.

Conventions, structure and status: [CLAUDE.md](CLAUDE.md).

Authentication (login, register, refresh, logout, password recovery, Google, account deletion) goes to `atm-auth-api`; data goes to `atm-orbita-api` with the same Bearer access token. Configure it with the public env vars in `.env.example`: `PUBLIC_AUTH_API_URL` (default `https://auth.atmosferast.com/v1`) and `PUBLIC_GOOGLE_CLIENT_ID` (the Google OAuth web client ID; empty hides Google sign-in; the auth API must accept that client). Run `pnpm exec playwright test` for the simulated Google and multi-tab session flows.

Services use the API and the server database through the existing SSH tunnel. The services and loans browser tests register temporary accounts in the auth API (`AUTH_API_URL`, default `https://auth.atmosferast.com/v1`), exercise real persistence and delete only their own test accounts afterwards. Details: [services plan](../atm-orbita-api/docs/plans/20-services.md).
