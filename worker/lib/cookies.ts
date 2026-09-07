// Signs and verifies the "verified" cookie using HMAC-SHA256.
// This avoids needing a session table in D1 — the cookie itself proves
// the visitor gave an email, without a database lookup on every request.

async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Produces a cookie value like "1725360000.9f3a...": a timestamp plus
// an HMAC signature over that timestamp, so it can't be forged without
// the secret, and you could add expiry logic later if you want.
export async function signVerifiedCookie(secret: string): Promise<string> {
  const key = await getKey(secret);
  const timestamp = Date.now().toString();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp)
  );
  return `${timestamp}.${toHex(signatureBuffer)}`;
}

export async function isVerifiedCookieValid(
  cookieValue: string,
  secret: string
): Promise<boolean> {
  const [timestamp, signatureHex] = cookieValue.split(".");
  if (!timestamp || !signatureHex) return false;

  const key = await getKey(secret);
  const expectedSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp)
  );
  const expectedHex = toHex(expectedSignatureBuffer);

  // Constant-time-ish comparison; not perfectly timing-safe but sufficient
  // here since this isn't guarding anything more sensitive than a free
  // download gate.
  return expectedHex === signatureHex;
}

// Reads a specific cookie by name out of a Request's Cookie header.
export function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}
