/* Il pannello visto dal browser: sessione, catalogo, allegati.

   Nessuna chiave qui dentro. Il token che scrive su GitHub vive solo nelle
   funzioni su Vercel; qui si parla con quelle, e la prova di essere entrati è
   un cookie che il browser allega da sé. */

import type { CatalogProduct } from "../../data/products";

/** Il messaggio del server se c'è, altrimenti qualcosa di leggibile. */
async function ask<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Una risposta non JSON è già di per sé un errore: lo diciamo sotto.
  }

  if (!res.ok) {
    const error = (body as { error?: string } | null)?.error;
    throw new Error(error ?? `Errore ${res.status}. Riprova.`);
  }
  return body as T;
}

export const getSession = () => ask<{ email: string | null }>("/api/session");

export const login = (email: string, password: string) =>
  ask<{ email: string }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const logout = () => ask<{ ok: true }>("/api/logout", { method: "POST" });

export const loadCatalog = () =>
  ask<{ products: CatalogProduct[]; sha: string | null }>("/api/catalog");

export const saveCatalog = (products: CatalogProduct[], sha: string | null) =>
  ask<{ sha: string; commit: string; count: number }>("/api/catalog", {
    method: "PUT",
    body: JSON.stringify({ products, sha: sha ?? undefined }),
  });

export type Uploaded = { url: string; size: string; reused: boolean };

export type UploadKind = "image" | "datasheet" | "catalog";

/** Larghezza massima di una foto di prodotto: oltre non si vede differenza
    in pagina, e il peso conta più dei pixel. */
const MAX_EDGE = 1600;

/** Qualità WebP: sopra 0.85 il file cresce senza che l'occhio ci guadagni. */
const QUALITY = 0.85;

function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Non riesco a leggere il file."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Ridimensiona e converte in WebP prima di spedire.
 *
 * Una foto di prodotto scaricata da un fornitore pesa spesso qualche megabyte:
 * così com'è supererebbe il limite di una richiesta e appesantirebbe il sito.
 * Gli SVG passano intatti — sono già leggeri e ridisegnarli su una tela li
 * trasformerebbe in pixel.
 */
async function shrink(file: File): Promise<{ blob: Blob; name: string }> {
  if (file.type === "image/svg+xml") return { blob: file, name: file.name };

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, name: file.name };
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY),
  );

  // Se la conversione non riesce, o non ha fatto guadagnare nulla, si spedisce
  // l'originale: meglio un file grande di un file peggiore.
  if (!webp || webp.size >= file.size) return { blob: file, name: file.name };

  return { blob: webp, name: `${file.name.replace(/\.[^.]+$/, "")}.webp` };
}

export async function uploadFile(file: File, kind: UploadKind): Promise<Uploaded> {
  const { blob, name } = kind === "image" ? await shrink(file) : { blob: file, name: file.name };

  return ask<Uploaded>("/api/upload", {
    method: "POST",
    body: JSON.stringify({ filename: name, contentBase64: await dataUrl(blob), kind }),
  });
}
