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

Google sign-in uses the API's runtime configuration. The owner must configure an OAuth web client in Google Cloud and set `GOOGLE_WEB_CLIENT_ID` on the API; no web environment variable is required. Setup and deployment instructions: [Google sign-in plan](../atm-orbita-api/docs/plans/19-google-sign-in.md). Run `pnpm exec playwright test` for the simulated Google and multi-tab session flows.

Services use the API and the server database through the existing SSH tunnel. No extra environment variables are needed. The services browser tests register temporary accounts, exercise real persistence and delete only their own test accounts afterwards. Details: [services plan](../atm-orbita-api/docs/plans/20-services.md).
