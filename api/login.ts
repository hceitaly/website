/* POST /api/login — entra nel pannello con email e password. */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { issue, sameSecret, setSessionCookie } from "./_lib/auth.js";
import { methodIs, readJson } from "./_lib/http.js";

/** Ritardo su credenziali sbagliate: rende noioso provarne a raffica. */
const PENALTY_MS = 400;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodIs(req, res, "POST")) return;

  const { email, password } = await readJson<{ email?: string; password?: string }>(req);

  const okEmail = process.env.ADMIN_EMAIL;
  const okPassword = process.env.ADMIN_PASSWORD;

  if (!okEmail || !okPassword) {
    res.status(500).json({
      error: "Pannello non configurato: mancano ADMIN_EMAIL e ADMIN_PASSWORD su Vercel.",
    });
    return;
  }

  // L'email non distingue maiuscole; la password sì, e si confronta a tempo
  // costante. Entrambe devono tornare: un messaggio solo per tutt'e due, così
  // non si scopre quali indirizzi esistono.
  const good =
    typeof email === "string" &&
    typeof password === "string" &&
    email.trim().toLowerCase() === okEmail.trim().toLowerCase() &&
    sameSecret(password, okPassword);

  if (!good) {
    await new Promise((r) => setTimeout(r, PENALTY_MS));
    res.status(401).json({ error: "Email o password non corrette." });
    return;
  }

  setSessionCookie(res, issue(okEmail));
  res.status(200).json({ email: okEmail });
}
