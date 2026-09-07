#!/usr/bin/env node
/**
 * process-images.js
 *
 * Batch-processes a folder of source graphics into three consistent
 * output sizes (thumbnail, preview, full-res) plus a JSON manifest
 * you can import into Airtable/your CMS to seed the catalog.
 *
 * USAGE:
 *   node process-images.js <source-dir> <output-dir>
 *
 * EXAMPLE:
 *   node process-images.js ./raw-archive ./processed
 *
 * INPUT STRUCTURE (preserve however you already have things organized):
 *   raw-archive/
 *     backgrounds/abstract/some-graphic.png
 *     textures/grunge/old-paper.jpg
 *
 * OUTPUT STRUCTURE (mirrors your input folders):
 *   processed/
 *     backgrounds/abstract/some-graphic/
 *       thumb.webp      (400px wide  - for grid/browse views)
 *       preview.webp    (1600px wide - for the on-page preview)
 *       full.jpg        (original size, optimized - the actual download)
 *     manifest.json      (metadata for every processed image)
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ---- CONFIG: adjust these to taste ----
const THUMB_WIDTH = 400;
const PREVIEW_WIDTH = 1600;
const WEBP_QUALITY = 82;       // thumb/preview quality (0-100)
const FULL_JPEG_QUALITY = 90;  // full-res download quality if converting to jpg
const VALID_EXTENSIONS = [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp"];
// ----------------------------------------

const [, , sourceDirArg, outputDirArg] = process.argv;

if (!sourceDirArg || !outputDirArg) {
  console.error("Usage: node process-images.js <source-dir> <output-dir>");
  process.exit(1);
}

const sourceDir = path.resolve(sourceDirArg);
const outputDir = path.resolve(outputDirArg);

if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

// Turns "My Cool Graphic (Final v2).PNG" into "my-cool-graphic-final-v2"
function slugify(filename) {
  const base = path.parse(filename).name;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Recursively walk the source directory and collect all image file paths
function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, fileList);
    } else if (VALID_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function processImage(filePath, manifest) {
  const relativePath = path.relative(sourceDir, filePath);
  const relativeDir = path.dirname(relativePath); // e.g. "backgrounds/abstract"
  const slug = slugify(filePath);

  const destDir = path.join(outputDir, relativeDir, slug);
  fs.mkdirSync(destDir, { recursive: true });

  const image = sharp(filePath);
  const metadata = await image.metadata();

  const thumbPath = path.join(destDir, "thumb.webp");
  const previewPath = path.join(destDir, "preview.webp");
  const fullPath = path.join(destDir, `full.jpg`);

  // Thumbnail — small, fast-loading, for grid/browse views
  await sharp(filePath)
    .resize({ width: THUMB_WIDTH })
    .webp({ quality: WEBP_QUALITY })
    .toFile(thumbPath);

  // Preview — larger, shown on the graphic's own page before download
  await sharp(filePath)
    .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(previewPath);

  // Full-res — the actual download, optimized but at original dimensions
  await sharp(filePath)
    .jpeg({ quality: FULL_JPEG_QUALITY, mozjpeg: true })
    .toFile(fullPath);

  manifest.push({
    slug,
    category: relativeDir === "." ? "" : relativeDir,
    originalFilename: path.basename(filePath),
    width: metadata.width,
    height: metadata.height,
    orientation:
      metadata.width === metadata.height
        ? "square"
        : metadata.width > metadata.height
        ? "landscape"
        : "portrait",
    thumbPath: path.relative(outputDir, thumbPath),
    previewPath: path.relative(outputDir, previewPath),
    fullPath: path.relative(outputDir, fullPath),
    // Placeholders for you to fill in later in Airtable/your CMS:
    title: "",
    style: "",
    dominantColor: "",
    license: "",
  });
}

async function main() {
  const files = walk(sourceDir);
  console.log(`Found ${files.length} image(s) to process.\n`);

  const manifest = [];
  let count = 0;

  for (const filePath of files) {
    count++;
    process.stdout.write(`Processing ${count}/${files.length}: ${path.relative(sourceDir, filePath)}\r`);
    try {
      await processImage(filePath, manifest);
    } catch (err) {
      console.error(`\nFailed on ${filePath}: ${err.message}`);
    }
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n\nDone. Processed ${manifest.length} image(s).`);
  console.log(`Manifest written to: ${manifestPath}`);
}

main();
