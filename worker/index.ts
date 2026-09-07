import { handleSubscribe } from "./routes/subscribe";
import { handleAdminLogin } from "./routes/admin-login";
import { handleDownload } from "./routes/download";
import { handleAdminPage } from "./routes/admin";

export interface Env {
  DB: D1Database;
  PRIVATE_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  COOKIE_SECRET: string;
  ADMIN_COOKIE_SECRET: string;
  ADMIN_PASSWORD: string;
  KIT_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/subscribe") {
      return handleSubscribe(request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/admin-login") {
      return handleAdminLogin(request, env);
    }

    const downloadMatch = url.pathname.match(/^\/api\/download\/(.+)$/);
    if (request.method === "GET" && downloadMatch) {
      return handleDownload(request, env, downloadMatch[1]);
    }

    if (request.method === "GET" && (url.pathname === "/admin" || url.pathname === "/admin/")) {
      return handleAdminPage(request, env);
    }

    // Everything else: serve the static Astro-built site.
    return env.ASSETS.fetch(request);
  },
};
