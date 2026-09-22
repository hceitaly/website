import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initPageTransition } from './lib/pageTransition'
import { headFor, renderHead, siteUrl } from './seo/meta'

/* L'intestazione SEO di questa pagina. In produzione arriva già scritta nel
   file HTML generato alla build, e qui non si tocca nulla. La si riscrive solo
   quando non combacia: in sviluppo (un solo index.html per tutto) e sugli
   indirizzi senza file loro, come un prodotto che non esiste. */
{
  const site = siteUrl(import.meta.env.VITE_SITE_URL)
  const head = headFor(window.location.pathname)
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
  const expected = `${site}${head.path === '/' ? '/' : head.path}`
  if (document.title !== head.title || canonical !== expected) {
    document.title = head.title
    document.head.querySelectorAll('[data-seo]').forEach((n) => n.remove())
    document.head.insertAdjacentHTML('beforeend', renderHead(head, site, false))
  }
}

// Le transizioni fra pagine sono del sito: nel pannello intercetterebbero i
// click senza avere niente da animare.
if (!/^\/admin\/?$/i.test(window.location.pathname)) initPageTransition()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
