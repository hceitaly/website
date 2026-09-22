/* Il repository come archivio dei contenuti.

   Il pannello non ha un database: quando il gestore salva, queste funzioni
   scrivono un commit su `hceitaly/website` e Vercel ripubblica da sé. Il
   token vive solo qui, in una variabile d'ambiente del server — il browser
   del gestore non lo vede mai e il gestore non ha accesso al repository. */

const API = "https://api.github.com";

type Repo = { owner: string; name: string; branch: string; token: string };

function repo(): Repo {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN mancante nelle variabili d'ambiente");

  const slug = process.env.GITHUB_REPO ?? "hceitaly/website";
  const [owner, name] = slug.split("/");
  if (!owner || !name) throw new Error(`GITHUB_REPO non valido: "${slug}" (atteso "utente/repo")`);

  return { owner, name, branch: process.env.GITHUB_BRANCH ?? "main", token };
}

/** `tolerate` sono gli stati che il chiamante sa interpretare da sé — un 404
    che vuol dire "non esiste ancora", un 409 che vuol dire "qualcuno ti ha
    preceduto". Tutto il resto diventa un errore qui. */
async function call(path: string, init: RequestInit = {}, tolerate: number[] = [404]) {
  const r = repo();
  const res = await fetch(`${API}/repos/${r.owner}/${r.name}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${r.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok && !tolerate.includes(res.status)) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status} su ${path}: ${body.slice(0, 300)}`);
  }
  return res;
}

/** Contenuto e `sha` di un file. Il `sha` serve a riscriverlo: è la prova di
    aver letto la versione che si sta sostituendo. `null` se non esiste. */
export async function readFile(path: string): Promise<{ text: string; sha: string } | null> {
  const r = repo();
  const res = await call(`/contents/${encodeURI(path)}?ref=${encodeURIComponent(r.branch)}`);
  if (res.status === 404) return null;

  const json = (await res.json()) as { content: string; sha: string };
  return { text: Buffer.from(json.content, "base64").toString("utf8"), sha: json.sha };
}

/**
 * Scrive un file e ne fa un commit.
 *
 * `sha` è la versione da cui si parte: passandolo, GitHub rifiuta la scrittura
 * se nel frattempo il file è cambiato, invece di sovrascrivere in silenzio il
 * lavoro di qualcun altro. Ometterlo significa "questo file è nuovo".
 */
export async function writeFile(opts: {
  path: string;
  /** Contenuto già in base64 — testo e binari passano per la stessa porta. */
  contentBase64: string;
  message: string;
  sha?: string;
}): Promise<{ sha: string; commit: string }> {
  const r = repo();
  const res = await call(
    `/contents/${encodeURI(opts.path)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: opts.message,
        content: opts.contentBase64,
        branch: r.branch,
        sha: opts.sha,
      }),
    },
    [409, 422],
  );

  if (res.status === 409 || res.status === 422) {
    throw new Error(
      "Il contenuto è stato modificato da qualcun altro nel frattempo. Ricarica il pannello e riprova.",
    );
  }

  const json = (await res.json()) as { content: { sha: string }; commit: { sha: string } };
  return { sha: json.content.sha, commit: json.commit.sha };
}
