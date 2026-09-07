# Migrating from Pages Functions to Workers-with-Assets

Your production project turned out to be set up as a Worker (Cloudflare's
current default for new projects), not classic Pages — which meant the
`functions/` folder from earlier was silently never running at all.
This is the fix: one Worker entry point that manually routes requests.

## What changed

- **DELETE your old `functions/` folder entirely** — it does nothing in
  this model and can be safely removed.
- **NEW: `worker/` folder** — same logic as before, restructured as
  plain functions instead of auto-routed files:
  - `worker/index.ts` — the single entry point; routes requests, falls
    back to `env.ASSETS.fetch(request)` for everything else (your site)
  - `worker/lib/cookies.ts` — unchanged logic from before
  - `worker/routes/*.ts` — same logic as the old `functions/api/*.ts`
    files, just exported as plain functions instead of `onRequestPost`
- **`wrangler.toml` REPLACED** — uses `main` + `[assets]` instead of
  `pages_build_output_dir`. Note the new `run_worker_first` setting —
  without it, Workers serves static files before your code ever runs,
  so `/api/*` and `/admin` would silently 404.

## Commands that change going forward

| Old (Pages) | New (Workers) |
|---|---|
| `npx wrangler pages dev` | `npx wrangler dev` |
| `npx wrangler pages deploy dist --project-name=X` | `npx wrangler deploy` |
| `npx wrangler pages secret put X` | `npx wrangler secret put X` |

Your D1 (`npx wrangler d1 execute ...`) and R2 commands are unaffected —
those work identically for both models.

## Tested locally before handing off

Ran `npx wrangler dev` against this exact code: confirmed all bindings
loaded (DB, PRIVATE_BUCKET, ASSETS, and all four secrets), confirmed
static asset serving works (`GET /` → 200), and confirmed the subscribe
API route works end-to-end (`POST /api/subscribe` → success).

## Next steps for you

1. Delete `functions/` from your project, add these `worker/` files and
   the new `wrangler.toml`.
2. Update your `.dev.vars` — no changes needed there, same variable names.
3. Test locally: `npm run build && npx wrangler dev`
4. Set your production secrets via the Workers CLI command (note: `secret`,
   not `pages secret`):
   ```
   npx wrangler secret put COOKIE_SECRET
   npx wrangler secret put ADMIN_COOKIE_SECRET
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put KIT_API_KEY
   ```
5. Deploy for real: `npx wrangler deploy`
6. Your git-push auto-deploy (connected to GitHub) should also pick up
   this new structure automatically on your next push, since Cloudflare
   reads `wrangler.toml` to know it's building a Worker now — but
   running `wrangler deploy` manually once first is worth doing to
   confirm everything works before relying on the git-triggered path.
