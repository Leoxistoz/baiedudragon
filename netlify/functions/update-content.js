import { getStore } from "@netlify/blobs";
import { verifySessionToken, getCookie } from "./_auth.js";

export default async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Méthode non autorisée." }, 405);
  }

  const token = getCookie(req, "session");
  if (!verifySessionToken(token)) {
    return json({ ok: false, error: "Non authentifié. Reconnecte-toi." }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "JSON invalide." }, 400);
  }

  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "Contenu invalide." }, 400);
  }

  const store = getStore("site-content");
  await store.setJSON("data", body);

  return json({ ok: true });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
