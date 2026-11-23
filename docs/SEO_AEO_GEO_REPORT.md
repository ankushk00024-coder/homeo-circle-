# Homeo India — Technical SEO, AEO & GEO report

Deployed 23 November 2026 to https://www.homeoindia.org (commit `787f9bf`).
SEO = classic search engines · AEO = answer engines (featured snippets, voice, "People also ask") · GEO = generative engines (ChatGPT, Claude, Perplexity, Gemini, Copilot).

## How it works
The site is a React single-page app. Crawlers that don't run JavaScript would normally see an empty page. `scripts/seo/postbuild.mjs` runs after every build and writes a real HTML file for each public page, containing:
- the title, meta description, canonical URL, `hreflang`, Open Graph and Twitter tags;
- schema.org JSON-LD;
- the page's readable content, answer first.

Browsers then load the app on top. The sources of truth are `src/seo/pages.json` (pages), `src/seo/faq.json` (FAQ) and `src/seo/membership.json` (categories), so the website, the structured data and the AI files never disagree.

## What was implemented

### Crawling & indexing
| Item | Status | Detail |
|---|---|---|
| Canonical domain | Done | All other domains 308-redirect to `https://www.homeoindia.org`; every page has a self-canonical |
| HTTPS + HSTS | Done | `max-age=63072000; includeSubDomains` |
| robots.txt | Done | Public pages open to all crawlers. Private app areas (`/community`, `/members`, `/events`, `/knowledge`, `/students`, `/dashboard`, `/profile`, `/settings`, `/publish`, `/admin`, …) are blocked |
| robots.txt bug fixed | Done | `Disallow: /community` also blocked `/community-rules` (robots rules match by prefix). Each rule now uses `$`, `?` and `/` forms |
| AI crawler rules | Done | Explicit rules for OAI-SearchBot, ChatGPT-User, GPTBot, Claude-SearchBot, Claude-User, ClaudeBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Meta-ExternalAgent, Amazonbot, CCBot, cohere-ai, Bytespider, DuckAssistBot, MistralAI-User, YouBot. All may read public pages; none may read private areas |
| XML sitemap | Done | 16 URLs with `lastmod`, `changefreq`, `priority`, plus the home-page image |
| Real 404s | Done | Unknown URLs now return **HTTP 404** with a `noindex` page (before, every URL returned 200 — "soft 404s"). App routes still load normally |
| noindex on private pages | Done | `noindex, nofollow` at runtime for member/admin pages, plus an `X-Robots-Tag` header on admin/account paths |
| IndexNow | Done | Key file `/65eb4d04d73ea71ef4b4ac9f761047bb.txt`. Every production build pings Bing, Yandex and other IndexNow engines (latest: 16 URLs, HTTP 202 accepted) |
| Search Console verification | Ready | Set `VITE_GOOGLE_SITE_VERIFICATION` (Google) and/or `VITE_BING_SITE_VERIFICATION` (Bing) in Vercel, then redeploy |

### On-page
| Item | Status |
|---|---|
| Unique title and description per page (titles ≤ 66 chars; descriptions 57–153 chars) | Done |
| One H1 per page; semantic headings | Done |
| `lang="en-IN"`, `hreflang` en-IN + x-default | Done |
| Open Graph + Twitter large-image cards (1200×630) | Done |
| Internal linking: every prerendered page links to all public pages; footer links FAQ and policies | Done |
| Accurate wording (no unsupported CME, "government", "official register" claims) | Done |

### Structured data (JSON-LD, validated — 0 parse errors on 16 pages)
| Type | Where |
|---|---|
| Organization (logo, alternateName, knowsAbout, areaServed India) | every page |
| WebSite | every page |
| WebPage / AboutPage / FAQPage / ContactPage / CollectionPage, each with `dateModified`, `publisher` and `speakable` | per page |
| FAQPage with 16 Question/Answer pairs | `/faq` |
| ItemList of membership categories (DefinedTerm) | `/eligibility`, `/apply`, `/verification-policy` |
| BreadcrumbList (Home → Legal & Policies → Policy) | all pages except home |

### AEO (answer engines)
- New **FAQ page** (`/faq`, 16 questions) with FAQPage schema. The same text is used on the page, in the schema and in llms.txt.
- **Answer-first summaries:** each page starts with a one-sentence definition (class `seo-summary`), marked `speakable` for voice assistants.
- Plain, quotable facts: who can join, that it is free, the 18+ rule, what each badge means, that CME credits require confirmed accreditation, and that it is not a government body.

### GEO (generative / AI engines)
- **`/llms.txt`** ([llmstxt.org](https://llmstxt.org) format): site summary, key facts and categorised links to every public page. It is advertised in `robots.txt`, in a `<link rel="alternate">` tag on every page and in an HTTP `Link` header.
- **`/llms-full.txt`**: all public content and the FAQ in one plain-text file (~13 KB) that AI assistants can read in a single request.
- Consistent entity naming (Homeo India / HomeoIndia / Homeo India Community) and a repeated independence disclaimer, so AI answers describe the platform correctly.
- Full content is present without JavaScript, for crawlers that don't render.

## Verified on the live deployment
- Unknown URL → **404** with a noindex page.
- `/members/123` → 200; the app loads.
- `/llms.txt` → 200, `text/plain`.
- Build log: "SEO: 16 pages + 404 … written", "IndexNow: submitted 16 URLs (HTTP 202)".

## What you need to do (cannot be done from code)
1. **Google Search Console:**
   - add `https://www.homeoindia.org` and verify it (DNS, or the meta tag via `VITE_GOOGLE_SITE_VERIFICATION`);
   - submit `https://www.homeoindia.org/sitemap.xml`;
   - request indexing for `/`, `/faq` and `/about`.
2. **Bing Webmaster Tools:** import from Search Console (one click). Bing also powers ChatGPT search and Copilot.
3. **Off-site entity signals (main GEO lever):**
   - create official profiles (LinkedIn page, Instagram, YouTube) and add their URLs to `organization.sameAs` in `src/seo/pages.json`;
   - get mentions or links from homoeopathy colleges, associations and blogs.
   - AI engines trust what other sites say about you.
4. **Operator details:** fill in `src/legal/config.ts` (legal name, contact). Trust signals affect both search ranking and AI citations.
5. **Content:** publish public, indexable articles such as guides for BHMS students and explainers on research. Right now discussions, research and events are members-only, so search engines and AI can index only the 16 public pages. Public content is what brings search traffic.

## Recommendations (not done yet)
- **Performance:** the main bundle is 447 KB (131 KB gzipped). It could be split further and the Playfair Display font subset, to improve Largest Contentful Paint on mobile. Measure in PageSpeed Insights after verification.
- **OG images:** one image is shared by all pages; per-page images would improve social and AI previews.
- **Public research summaries:** a public, indexable version of approved research summaries (with citations) would add strong long-tail search and AI-citation content.
- **Monitoring:** check Search Console Coverage and Bing "AI Performance" reports monthly; re-run a structured-data test after content changes.

## Files
- `scripts/seo/postbuild.mjs` — generator (HTML, JSON-LD, sitemap, robots, llms.txt, 404, IndexNow)
- `src/seo/pages.json` · `src/seo/faq.json` · `src/seo/membership.json` — content sources
- `src/pages/public/FaqPage.tsx` — FAQ page
- `src/seo/RouteSeo.tsx` — runtime title, description, canonical and robots for in-app navigation
- `vercel.json` — redirects, explicit app routes (for real 404s), headers
