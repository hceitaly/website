/* GET /api/session — chi sta usando il pannello, se qualcuno lo sta usando.
   Serve all'interfaccia per decidere se mostrare il login o il catalogo. */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readSession } from "./_lib/auth.js";
import { methodIs } from "./_lib/http.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodIs(req, res, "GET")) return;

  try {
    const email = readSession(req);
    res.status(200).json({ email });
  } catch {
    // SESSION_SECRET non configurata: nessuna sessione è valida, ma la
    // pagina di login deve comunque poter comparire.
    res.status(200).json({ email: null });
  }
}
