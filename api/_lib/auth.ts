/* Sessione del pannello.

   Il gestore entra con email e password sue — non serve un account GitHub —
   e riceve un cookie firmato. Nessun database: il cookie porta con sé la
   scadenza e una firma HMAC che solo il server sa produrre, quindi verificarlo
   è un calcolo, non una lettura. */

import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const COOKIE = "hce_session";

/** Quanto dura una sessione: una giornata di lavoro. */
const TTL_MS = 12 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET mancante o troppo corta (min 16 caratteri)");
  }
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

/** Confronto a tempo costante: due stringhe di lunghezza diversa non devono
    poter essere distinte più in fretta di due lunghe uguali. */
export function sameSecret(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Token = payload firmato. Il payload dice chi è e fino a quando vale. */
export function issue(email: string): string {
  const payload = b64url(JSON.stringify({ email, exp: Date.now() + TTL_MS }));
  const mac = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

/** L'email di chi ha una sessione valida, o `null`. Firma prima, scadenza poi:
    un token manomesso non arriva nemmeno a farsi leggere il contenuto. */
export function readSession(req: VercelRequest): string | null {
  const raw = req.headers.cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);

  if (!raw) return null;

  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;

  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  if (!sameSecret(mac, expected)) return null;

  try {
    const { email, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof exp !== "number" || exp < Date.now()) return null;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

/** `Secure` solo in produzione: in locale `vercel dev` parla http e il
    browser scarterebbe il cookie. */
export function setSessionCookie(res: VercelResponse, token: string | null) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const value = token
    ? `${COOKIE}=${token}; Max-Age=${Math.floor(TTL_MS / 1000)}`
    : `${COOKIE}=; Max-Age=0`;
  res.setHeader("Set-Cookie", `${value}; Path=/; HttpOnly; SameSite=Strict${secure}`);
}

/** Cancello di ogni endpoint che tocca il contenuto. Risponde da sé con 401
    e restituisce `null` quando la sessione non c'è: al chiamante basta
    `if (!requireSession(req, res)) return;`. */
export function requireSession(req: VercelRequest, res: VercelResponse): string | null {
  const email = readSession(req);
  if (!email) {
    res.status(401).json({ error: "Sessione scaduta. Rientra nel pannello." });
    return null;
  }
  return email;
}
