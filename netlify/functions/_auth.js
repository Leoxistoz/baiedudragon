// Petit module d'authentification "maison", sans dépendance externe.
// Il signe un cookie de session avec une clé secrète (AUTH_SECRET) que
// seul Netlify connaît. Personne ne peut fabriquer un cookie valide
// sans connaître cette clé.

import { createHmac, timingSafeEqual } from "node:crypto";

const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;

function sign(payloadB64) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Variable d'environnement AUTH_SECRET manquante");
  }
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function createSessionToken() {
  const payload = JSON.stringify({ exp: Date.now() + SEVEN_DAYS_MS });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return false;

  let expected;
  try {
    expected = sign(payloadB64);
  } catch {
    return false;
  }

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildSessionCookie(token, maxAgeSeconds) {
  return `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}
