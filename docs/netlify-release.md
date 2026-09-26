# Netlify release compatibility

Prepared from main 2f1c3ec52934f726acca79154905c129c30e785e on 2026-09-26.

The previous deployment predated the Express backend refactor. Publishing dist
alone would remove the API. The Netlify function now uses the same Express app
through serverless-http; standalone startup lives in server/start.ts. Existing
dev, dev:server and preview commands still start the full Node application.

Netlify serves the Vite output and maps /api/* to the function, ahead of the SPA
fallback. The adapter preserves raw request bytes (including Stripe signatures),
response status, headers and cookies. It derives proxy details from the request
URL and Netlify context rather than accepting forwarded client headers.

Validation: npm test, npm run lint, npm run build, npm run test:netlify and
netlify functions:build passed. The adapter test covers unauthorized endpoints,
origin rejection, empty OPTIONS responses and valid/invalid signed raw bodies
without making external requests. No actual payment was made.

Use the existing WordPilot site d6bc95b5-3bc5-4b65-9184-c657fd33af16.
Builds require the existing public VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
Runtime secrets remain in Netlify environment settings, never in the bundle.
Do not upload .env files. CAPTCHA activation still requires configured keys.

Read-only database preflight found the Shadowing RPC, enabled session trigger,
RLS and authenticated-only execute grants. Migration history records
20260913143636 shadowing_account_video_quota; no database changes were made by
this deployment task.

Platform caveats: in-memory Express rate limits are per function instance, not
a distributed abuse boundary. Supabase-backed entitlements remain authoritative.
Netlify function payload/time limits still apply to recordings and long AI calls.
Live OAuth, microphone and paid checkout acceptance require the appropriate
user/provider interaction; automated preflight does not claim these were tested.
