import { signVerifiedCookie } from "../lib/cookies";
import type { Env } from "../index";

export async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@") || email.length > 254) {
    return new Response(JSON.stringify({ error: "Please enter a valid email" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await env.DB.prepare("INSERT OR IGNORE INTO emails (email) VALUES (?)").bind(email).run();

  try {
    await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": env.KIT_API_KEY,
      },
      body: JSON.stringify({ email_address: email, state: "active" }),
    });
  } catch (err) {
    console.error("Kit subscribe failed (non-fatal):", err);
  }

  const cookieValue = await signVerifiedCookie(env.COOKIE_SECRET);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // NOTE: no HttpOnly here (unlike the admin cookie) — the graphic
      // page's client-side script needs to read this via document.cookie
      // to decide whether to show the download button or the email form.
      "Set-Cookie": `verified=${cookieValue}; Path=/; Secure; SameSite=Lax; Max-Age=31536000`,
    },
  });
}
