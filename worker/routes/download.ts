import manifest from "../../src/data/manifest.json";
import { getCookieValue, isVerifiedCookieValid } from "../lib/cookies";
import type { GraphicEntry } from "../../src/lib/types";
import type { Env } from "../index";

const graphics = manifest as GraphicEntry[];

export async function handleDownload(request: Request, env: Env, slug: string): Promise<Response> {
  const cookieValue = getCookieValue(request, "verified");
  const isVerified =
    cookieValue !== null && (await isVerifiedCookieValid(cookieValue, env.COOKIE_SECRET));

  if (!isVerified) {
    return new Response(JSON.stringify({ error: "Email verification required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const graphic = graphics.find((g) => g.slug === slug);
  if (!graphic) {
    return new Response(JSON.stringify({ error: "Graphic not found" }), { status: 404 });
  }

  const object = await env.PRIVATE_BUCKET.get(graphic.fullPath);
  if (!object) {
    return new Response(JSON.stringify({ error: "File missing from storage" }), { status: 404 });
  }

  await env.DB.prepare("INSERT INTO downloads (slug) VALUES (?)").bind(slug).run();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Disposition", `attachment; filename="${slug}.jpg"`);

  return new Response(object.body, { headers });
}
