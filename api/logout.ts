/* POST /api/logout — chiude la sessione svuotando il cookie. */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setSessionCookie } from "./_lib/auth.js";
import { methodIs } from "./_lib/http.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodIs(req, res, "POST")) return;
  setSessionCookie(res, null);
  res.status(200).json({ ok: true });
}
