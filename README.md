# Catalog Pages for prodbytes.com

Drop these files into your existing Astro project (matching the same
folder paths) to get a working, filterable catalog grid plus an individual
download page per graphic — both driven entirely by manifest.json.

## Files

- `src/pages/index.astro` — the main grid page with category/orientation filters
- `src/pages/graphics/[slug].astro` — one static page generated per graphic, with a download button
- `src/lib/config.ts` — your CDN base URL, defined once
- `src/lib/types.ts` — shared TypeScript type for a manifest entry
- `src/data/manifest.example.json` — sample data matching the exact shape
  your processing script outputs (rename to `manifest.json` and replace
  with your real one)

## Before this works on your real site

1. Copy your actual `manifest.json` (from running `process-images.js`)
   into `src/data/manifest.json`.
2. Confirm `CDN_BASE_URL` in `src/lib/config.ts` matches your R2 custom
   domain exactly.
3. Run `npm run build` — this was tested and confirmed working against
   sample data with this exact structure before being handed to you.

## A build quirk I ran into (and already fixed for you)

Astro's build-time code splitting for `getStaticPaths()` can silently
drop top-level variables that are only referenced inside it. The fix
(already applied in `[slug].astro`) is defining the typed manifest array
*inside* `getStaticPaths()` itself rather than above it. If you ever see
a `"graphics is not defined"` error while editing this file, that's the
cause — keep the manifest casting inside the function.

## Filtering

The category dropdown on the grid page populates itself automatically
from whatever categories exist in your manifest — no need to hardcode
categories as you add more graphics.
