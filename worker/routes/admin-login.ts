import { signVerifiedCookie } from "../lib/cookies";
import type { Env } from "../index";

export async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  if (body.password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Incorrect password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cookieValue = await signVerifiedCookie(env.ADMIN_COOKIE_SECRET);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `admin_verified=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`,
    },
  });
}
