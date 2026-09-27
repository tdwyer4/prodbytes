import manifest from "../data/manifest.json";
import type { GraphicEntry } from "../lib/types";

const graphics = manifest as GraphicEntry[];
const SITE_URL = "https://prodbytes.com";

// Static pages beyond the auto-generated graphic pages. Add new ones
// here as you build them (e.g. "/about", "/license").
const STATIC_PATHS = ["/", "/about", "/privacy", "/license", "/cookies"];

export async function GET() {
  const staticUrls = STATIC_PATHS.map(
    (path) => `  <url><loc>${SITE_URL}${path}</loc></url>`
  );

  const graphicUrls = graphics.map(
    (graphic) => `  <url><loc>${SITE_URL}/graphics/${graphic.slug}/</loc></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...graphicUrls].join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
