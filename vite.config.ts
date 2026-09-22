import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Le funzioni di `api/` anche in `npm run dev`.
 *
 * In produzione le serve Vercel; in locale il dev server di Vite non le
 * conosce, e il pannello `/admin` sarebbe provabile solo dopo un deploy.
 * Questo plugin instrada `/api/<nome>` sul file `api/<nome>.ts` e aggiunge
 * alla risposta i due metodi di comodo che Vercel mette a disposizione
 * (`status` e `json`), che nel Node liscio non esistono.
 */
function devApi(): Plugin {
  const root = path.resolve(process.cwd(), 'api')

  return {
    name: 'hce-dev-api',
    apply: 'serve',
    config(_, { mode }) {
      /* In produzione le variabili le mette Vercel. In locale stanno in
         `.env.local`, che Vite però carica solo per il browser: gli endpoint
         girano in Node e leggono `process.env`, quindi gliele passiamo noi.
         Restano fuori dal bundle: qui siamo nel processo del dev server. */
      const env = loadEnv(mode, process.cwd(), '')
      for (const key of [
        'ADMIN_EMAIL',
        'ADMIN_PASSWORD',
        'SESSION_SECRET',
        'GITHUB_TOKEN',
        'GITHUB_REPO',
        'GITHUB_BRANCH',
      ]) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()

        // Solo il nome dell'endpoint: niente query, niente percorsi risaliti.
        const name = url.split('?')[0].slice('/api/'.length).replace(/\/+$/, '')
        if (!/^[a-z0-9-]+$/.test(name)) return next()

        const file = path.join(root, `${name}.ts`)
        if (!fs.existsSync(file)) return next()

        const reply = res as ServerResponse & {
          status: (code: number) => typeof reply
          json: (data: unknown) => typeof reply
        }
        reply.status = (code) => {
          res.statusCode = code
          return reply
        }
        reply.json = (data) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
          return reply
        }

        try {
          const mod = await server.ssrLoadModule(file)
          await (mod.default as (q: unknown, s: unknown) => unknown)(req, reply)
        } catch (err) {
          server.config.logger.error(`[api/${name}] ${String(err)}`)
          if (!res.writableEnded) reply.status(500).json({ error: String(err) })
        }
      })
    },
  }
}

/** Quello che il plugin SEO usa di `src/seo/meta.ts`. Il modulo si carica a
    build finita con il loader di Vite, perché è TypeScript del sito e importa
    il catalogo in JSON: un import diretto da qui lo farebbe controllare con le
    regole di Node, che non sono le sue. */
type SeoModule = {
  siteUrl: (fromEnv?: string) => string
  headFor: (path: string) => unknown
  renderHead: (head: unknown, site: string) => string
  prerenderRoutes: () => string[]
  sitemap: (site: string) => string
  robots: (site: string) => string
}

/**
 * Un HTML per pagina, con l'intestazione giusta — titolo, descrizione,
 * canonico, anteprime social, dati strutturati — più sitemap.xml e robots.txt.
 *
 * Il corpo resta quello della single page app: cambia solo la testa, che è ciò
 * che leggono i motori prima di eseguire il JavaScript e ciò che usano
 * WhatsApp, LinkedIn & co. per le anteprime dei link. I file seguono la
 * convenzione di `cleanUrls` di Vercel: `/prodotti` → `prodotti.html`,
 * `/prodotti/<id>` → `prodotti/<id>.html`.
 */
function seo(): Plugin {
  let outDir = ''
  let siteFromEnv = ''

  return {
    name: 'hce-seo',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      siteFromEnv = loadEnv(config.mode, config.root, '').VITE_SITE_URL ?? ''
    },
    async closeBundle() {
      const { createServer } = await import('vite')
      const loader = await createServer({
        configFile: false,
        root: process.cwd(),
        logLevel: 'error',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false },
      })

      try {
        const m = (await loader.ssrLoadModule('/src/seo/meta.ts')) as unknown as SeoModule
        const site = m.siteUrl(siteFromEnv)
        const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
        const marker = /<!--seo-->[\s\S]*?<!--\/seo-->/
        if (!marker.test(template)) {
          throw new Error('index.html: mancano i segnaposto <!--seo--> … <!--/seo-->')
        }

        const routes = m.prerenderRoutes()
        for (const route of routes) {
          const head = m.renderHead(m.headFor(route), site)
          // Funzione, non stringa: nei titoli un "$" verrebbe letto come
          // riferimento al gruppo trovato.
          const html = template.replace(marker, () => `<!--seo-->\n    ${head}\n    <!--/seo-->`)
          const file = route === '/' ? 'index.html' : `${route.slice(1)}.html`
          const target = path.join(outDir, file)
          fs.mkdirSync(path.dirname(target), { recursive: true })
          fs.writeFileSync(target, html)
        }

        fs.writeFileSync(path.join(outDir, 'sitemap.xml'), m.sitemap(site))
        fs.writeFileSync(path.join(outDir, 'robots.txt'), m.robots(site))
        console.log(`[seo] ${routes.length} pagine, sitemap e robots per ${site}`)
      } finally {
        await loader.close()
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApi(), seo()],
})
