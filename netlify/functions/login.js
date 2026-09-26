import { createSessionToken, buildSessionCookie } from "./_auth.js";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Méthode non autorisée", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Requête invalide." }, 400);
  }

  const password = body && body.password;
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return json(
      { ok: false, error: "ADMIN_PASSWORD n'est pas configuré sur Netlify." },
      500
    );
  }

  if (!password || password !== expected) {
    return json({ ok: false, error: "Mot de passe incorrect." }, 401);
  }

  const token = createSessionToken();
  const cookie = buildSessionCookie(token, 60 * 60 * 24 * 7); // 7 jours

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie
    }
  });
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
