// Cette Edge Function s'exécute AVANT que dashboard.html ne soit servi.
// Si le visiteur n'a pas de cookie de session valide, on le renvoie
// vers la page de connexion (admin.html) au lieu de lui montrer le tableau de bord.

export default async (request, context) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  const valid = token ? await isValid(token) : false;

  if (!valid) {
    const loginUrl = new URL("admin.html", request.url);
    return Response.redirect(loginUrl, 302);
  }

  return context.next();
};

async function isValid(token) {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;

  const secret = Netlify.env.get("AUTH_SECRET");
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  const expected = toBase64Url(new Uint8Array(sigBuffer));

  if (expected !== signature) return false;

  try {
    const json = atob(fromBase64Url(payloadB64));
    const payload = JSON.parse(json);
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function toBase64Url(bytes) {
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return s;
}

export const config = { path: "/dashboard.html" };
