# Image Batch Processor

Turns your raw graphics archive into three consistent, web-ready sizes plus a
JSON manifest for your catalog/CMS.

## Setup (one-time)

You'll need [Node.js](https://nodejs.org) installed. Then:

```bash
cd image-pipeline
npm install
```

## Usage

```bash
node process-images.js <path-to-your-archive> <path-to-output-folder>
```

Example:

```bash
node process-images.js "/Users/tim/Graphics Archive" ./processed
```

- **Source folder**: point this at your existing archive. Whatever folder
  structure you already use (e.g. `backgrounds/abstract/`,
  `textures/grunge/`) is preserved automatically — no need to reorganize
  anything first.
- **Output folder**: gets created if it doesn't exist. This is what you'll
  upload to R2.

## What you get, per image

```
processed/backgrounds/abstract/cool-blue-gradient/
  thumb.webp     - 400px wide, for browse/grid views
  preview.webp   - 1600px wide, for the graphic's own page
  full.jpg       - original dimensions, optimized, the actual download
```

Plus a single `processed/manifest.json` listing every processed image with
its dimensions, orientation, and category — ready to import into
Airtable/your CMS. The `title`, `style`, `dominantColor`, and `license`
fields are left blank for you to fill in (that's your tagging pass).

## Before running on your real archive

1. **Run it on a small test folder first** (10-20 images) and check the
   output looks right before pointing it at your whole archive.
2. **Messy filenames are fine** — "My Cool Graphic (Final v2).PNG" becomes
   the slug `my-cool-graphic-final-v2` automatically.
3. **Quality/size settings are adjustable** at the top of
   `process-images.js` (`THUMB_WIDTH`, `PREVIEW_WIDTH`,
   `WEBP_QUALITY`, `FULL_JPEG_QUALITY`) if you want different sizes.
4. **This does not upload anything** — it only processes files locally.
   Uploading the `processed/` folder to R2 is the next step, once you're
   happy with the output.
