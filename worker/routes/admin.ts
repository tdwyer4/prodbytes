import { getCookieValue, isVerifiedCookieValid } from "../lib/cookies";
import type { Env } from "../index";

function pageShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin — prodbytes.com</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 3rem auto; padding: 0 1.5rem; color: #1a1a1a; }
    h1 { margin-bottom: 0.25rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; }
    .stat-row { display: flex; gap: 2rem; margin: 1.5rem 0; }
    .stat { background: #f6f6f6; border-radius: 10px; padding: 1rem 1.5rem; }
    .stat-num { font-size: 1.8rem; font-weight: 700; display: block; }
    .stat-label { font-size: 0.85rem; color: #777; }
    input, button { padding: 0.7rem 1rem; border-radius: 8px; border: 1px solid #ccc; font-size: 0.95rem; }
    button { background: #1a1a1a; color: white; border: none; cursor: pointer; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

const loginForm = pageShell(`
  <h1>Admin Login</h1>
  <form id="login-form" style="display:flex; gap:0.6rem; margin-top:1rem;">
    <input type="password" id="password" placeholder="Password" required />
    <button type="submit">Log in</button>
  </form>
  <script>
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        location.reload();
      } else {
        alert('Incorrect password');
      }
    });
  </script>
`);

export async function handleAdminPage(request: Request, env: Env): Promise<Response> {
  const cookieValue = getCookieValue(request, "admin_verified");
  const isAdmin =
    cookieValue !== null && (await isVerifiedCookieValid(cookieValue, env.ADMIN_COOKIE_SECRET));

  if (!isAdmin) {
    return new Response(loginForm, { headers: { "Content-Type": "text/html" } });
  }

  const totalEmails = await env.DB.prepare("SELECT COUNT(*) as count FROM emails").first<{
    count: number;
  }>();
  const totalDownloads = await env.DB.prepare("SELECT COUNT(*) as count FROM downloads").first<{
    count: number;
  }>();
  const topGraphics = await env.DB.prepare(
    "SELECT slug, COUNT(*) as count FROM downloads GROUP BY slug ORDER BY count DESC LIMIT 10"
  ).all<{ slug: string; count: number }>();
  const recentEmails = await env.DB.prepare(
    "SELECT email, created_at FROM emails ORDER BY created_at DESC LIMIT 10"
  ).all<{ email: string; created_at: string }>();

  const topGraphicsRows = topGraphics.results
    .map((row) => `<tr><td>${row.slug}</td><td>${row.count}</td></tr>`)
    .join("");

  const recentEmailsRows = recentEmails.results
    .map((row) => `<tr><td>${row.email}</td><td>${row.created_at}</td></tr>`)
    .join("");

  const html = pageShell(`
    <h1>Prodbytes Admin</h1>
    <div class="stat-row">
      <div class="stat"><span class="stat-num">${totalEmails?.count ?? 0}</span><span class="stat-label">Total signups</span></div>
      <div class="stat"><span class="stat-num">${totalDownloads?.count ?? 0}</span><span class="stat-label">Total downloads</span></div>
    </div>
    <h2>Top Graphics</h2>
    <table><tr><th>Slug</th><th>Downloads</th></tr>${topGraphicsRows || "<tr><td colspan=2>No downloads yet</td></tr>"}</table>
    <h2>Recent Signups</h2>
    <table><tr><th>Email</th><th>Signed up</th></tr>${recentEmailsRows || "<tr><td colspan=2>No signups yet</td></tr>"}</table>
  `);

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
