// Runs after `vite build`. It turns the single-page app into something search
// engines, link previews and AI assistants can read without running
// JavaScript. Using src/seo/*.json it writes, into dist/:
//
//  * one HTML file per public page (e.g. dist/about/index.html) with the
//    page's title, description, canonical URL, social tags, structured data
//    (schema.org JSON-LD) and its readable content, answer first;
//  * 404.html — served with a real 404 status for unknown addresses;
//  * sitemap.xml and robots.txt (with explicit rules for AI crawlers);
//  * llms.txt and llms-full.txt — plain-text guides for AI assistants;
//  * the IndexNow key file, and (on production builds) an IndexNow ping so
//    Bing and other IndexNow engines learn about changes quickly.
//
// Site address: VITE_SITE_URL or seo.defaultSiteUrl. Google Search Console
// verification: VITE_GOOGLE_SITE_VERIFICATION. Bing: VITE_BING_SITE_VERIFICATION.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dist = path.join(root, 'dist');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const seo = readJson('src/seo/pages.json');
const faq = readJson('src/seo/faq.json');
const membership = readJson('src/seo/membership.json');

const SITE = (process.env.VITE_SITE_URL || seo.defaultSiteUrl).replace(/\/+$/, '');
const GOOGLE_VERIFY = (process.env.VITE_GOOGLE_SITE_VERIFICATION || '').trim();
const BING_VERIFY = (process.env.VITE_BING_SITE_VERIFICATION || '').trim();
const INDEXNOW_KEY = seo.indexNowKey;
const today = new Date().toISOString().slice(0, 10);
const DISCLAIMER = 'Homeo India is an independent platform. It is not a government authority, statutory medical council, licensing body or medical registration authority.';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlFor = (p) => `${SITE}${p === '/' ? '/' : p}`;
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// ── Structured data ───────────────────────────────────────────────────────────
const organization = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: seo.siteName,
  alternateName: seo.organization.alternateName,
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', '@id': `${SITE}/#logo`, url: `${SITE}/icon-512.png`, width: 512, height: 512, caption: seo.siteName },
  image: { '@id': `${SITE}/#logo` },
  description: seo.organization.description,
  ...(seo.organization.email ? { email: seo.organization.email } : {}),
  areaServed: { '@type': 'Country', name: 'India' },
  knowsAbout: seo.organization.knowsAbout,
  ...(seo.organization.sameAs.length ? { sameAs: seo.organization.sameAs } : {}),
};
const website = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: seo.siteName,
  alternateName: seo.organization.alternateName,
  url: `${SITE}/`,
  description: seo.organization.description,
  inLanguage: 'en-IN',
  publisher: { '@id': `${SITE}/#organization` },
};

const PAGE_TYPE = {
  '/about': 'AboutPage',
  '/faq': 'FAQPage',
  '/contact': 'ContactPage',
  '/legal': 'CollectionPage',
};

function jsonLdFor(page) {
  const pageUrl = urlFor(page.path);
  const graph = [organization, website];
  const webPage = {
    '@type': PAGE_TYPE[page.path] || 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: page.title,
    headline: page.h1,
    description: page.description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE}/#website` },
    about: { '@id': `${SITE}/#organization` },
    publisher: { '@id': `${SITE}/#organization` },
    dateModified: page.updated || today,
    primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}${seo.ogImage}` },
    // Lets voice assistants read the heading and the answer-first summary.
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.seo-summary'] },
    ...(page.path !== '/' ? { breadcrumb: { '@id': `${pageUrl}#breadcrumb` } } : {}),
  };
  if (page.path === '/faq') {
    webPage.mainEntity = faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    }));
  }
  graph.push(webPage);

  if (page.path === '/eligibility' || page.path === '/apply' || page.path === '/verification-policy') {
    graph.push({
      '@type': 'ItemList',
      '@id': `${pageUrl}#membership-categories`,
      name: 'Homeo India membership categories',
      itemListElement: membership.categories.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'DefinedTerm',
          name: c.label,
          description: `${c.who} Needs: ${c.needs.join(', ')}. Badge after verification: ${c.badge}.`,
          url: `${SITE}/apply?role=${c.value}`,
        },
      })),
    });
  }

  if (page.path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: seo.siteName, item: `${SITE}/` },
        ...(page.parent ? [{ '@type': 'ListItem', position: 2, name: page.parent[1], item: urlFor(page.parent[0]) }] : []),
        { '@type': 'ListItem', position: page.parent ? 3 : 2, name: page.h1, item: pageUrl },
      ],
    });
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

// ── Readable content (shown to crawlers; hidden once the app loads) ───────────
function prerenderFor(page) {
  const links = page.links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join('');
  const [lead, ...rest] = page.content.length ? page.content : [page.description];
  let body = `<p class="seo-summary">${esc(lead)}</p>${rest.map((p) => `<p>${esc(p)}</p>`).join('')}`;
  if (page.path === '/faq') {
    body = `<p class="seo-summary">${esc(page.description)}</p>` +
      faq.items.map((it) => `<section><h2>${esc(it.q)}</h2><p>${esc(it.a)}</p></section>`).join('');
  }
  if (page.path === '/eligibility' || page.path === '/apply') {
    body += '<h2>Membership categories</h2><ul>' + membership.categories.map((c) =>
      `<li><strong>${esc(c.label)}</strong> — ${esc(c.who)} Needs: ${esc(c.needs.join(', '))}. Badge: ${esc(c.badge)}.</li>`).join('') + '</ul>';
  }
  const nav = seo.pages.filter((p) => p.path !== page.path && p.path !== '/login').map((p) => `<a href="${esc(p.path)}">${esc(p.h1)}</a>`).join(' · ');
  return `<main class="seo-prerender" style="max-width:44rem;margin:0 auto;padding:3rem 1.25rem;font-family:system-ui,sans-serif;color:#14243F;line-height:1.6">` +
    `<p style="letter-spacing:.14em;font-weight:700">HOMEO <span style="color:#0D817B">INDIA</span></p>` +
    `<h1 style="font-size:2rem;line-height:1.2">${esc(page.h1)}</h1>${body}<ul>${links}</ul>` +
    `<footer style="margin-top:2rem;font-size:.85rem;color:#5a6e85"><p>${esc(DISCLAIMER)}</p><nav>${nav}</nav></footer></main>`;
}

function pageHtml(page, { robots } = {}) {
  const title = esc(page.title);
  const desc = esc(page.description);
  const url = urlFor(page.path);
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${desc}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${desc}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${desc}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<link rel="alternate" hreflang="en-IN" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/, `$1${url}$2`)
    .replace('<!--__JSON_LD__-->', robots ? '' : jsonLdFor(page))
    .replace('<!--__PRERENDER__-->', prerenderFor(page));
  if (robots) html = html.replace(/(<meta name="robots" content=")[^"]*(")/, `$1${robots}$2`);
  return html;
}

function finalize(html) {
  const verify = [
    GOOGLE_VERIFY && `<meta name="google-site-verification" content="${esc(GOOGLE_VERIFY)}" />`,
    BING_VERIFY && `<meta name="msvalidate.01" content="${esc(BING_VERIFY)}" />`,
  ].filter(Boolean).join('\n    ');
  return html
    .replaceAll('__SITE_URL__', SITE)
    .replace('<!--__GOOGLE_SITE_VERIFICATION__-->', verify)
    .replace('<!--__JSON_LD__-->', '')
    .replace('<!--__PRERENDER__-->', '');
}

// 1. Per-page HTML. The home page overwrites dist/index.html, which is also
//    the shell for signed-in app routes (those get noindex at runtime).
let count = 0;
for (const page of seo.pages) {
  const out = page.path === '/' ? path.join(dist, 'index.html') : path.join(dist, page.path.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, finalize(pageHtml(page)));
  count++;
}

// 2. 404 page (real 404 status from the host; noindex).
fs.writeFileSync(path.join(dist, '404.html'), finalize(pageHtml({
  path: '/404', title: `Page not found | ${seo.siteName}`, h1: 'Page not found',
  description: 'This page does not exist on Homeo India.',
  content: ['This page does not exist. Try the home page, the FAQ or the list of policies.'],
  links: [['/', 'Home'], ['/faq', 'FAQ'], ['/legal', 'Legal & Policies']],
}, { robots: 'noindex, follow' })));

// 3. sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${seo.pages.map((p) => `  <url>
    <loc>${urlFor(p.path)}</loc>
    <lastmod>${p.updated || today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority.toFixed(1)}</priority>${p.path === '/' ? `
    <image:image><image:loc>${SITE}${seo.ogImage}</image:loc><image:title>${esc(seo.siteName)}</image:title></image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

// 4. robots.txt — public pages open to search engines and AI assistants;
//    members-only and admin areas closed to every crawler.
// "$" and "/" forms so /community does not also block /community-rules.
const disallow = seo.privatePaths.flatMap((p) => [`Disallow: ${p}$`, `Disallow: ${p}?`, `Disallow: ${p}/`]).join('\n');
const aiAgents = [
  // AI search & assistants (fetch pages to answer people's questions)
  'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User',
  'DuckAssistBot', 'MistralAI-User', 'YouBot',
  // AI model training / grounding crawlers
  'GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'Meta-ExternalAgent', 'Amazonbot', 'CCBot', 'cohere-ai', 'Bytespider',
];
const robots = `# Homeo India — ${SITE}
# Public pages are open to search engines and AI assistants.
# Members-only and admin areas are private and must not be crawled.
# AI-readable summary: ${SITE}/llms.txt (full text: ${SITE}/llms-full.txt)

User-agent: *
Allow: /
${disallow}

${aiAgents.map((a) => `User-agent: ${a}`).join('\n')}
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
${disallow}

Sitemap: ${SITE}/sitemap.xml
`;
fs.writeFileSync(path.join(dist, 'robots.txt'), robots);

// 5. llms.txt (https://llmstxt.org) and llms-full.txt
const pageLine = (p) => `- [${p.label || p.h1}](${urlFor(p.path)}): ${p.description}`;
const group = (paths) => seo.pages.filter((p) => paths.includes(p.path)).map(pageLine).join('\n');
const llms = `# ${seo.siteName}

> ${seo.organization.description} ${DISCLAIMER}

Key facts:
- Website: ${SITE}/ (also known as ${seo.organization.alternateName.join(', ')})
- Audience: homoeopathic practitioners, BHMS students, interns, qualified graduates and academics in India. Not a patient consultation service.
- Membership: free, for people aged 18+, in five categories — ${membership.categories.map((c) => c.label).join(', ')}.
- Verification: a person reviews each application. The "Verified Registered Practitioner" badge is shown only after a member's professional registration is checked against registration records; a verified degree alone is not a verified registration.
- Events carry CME credits only when an event states a confirmed accreditation.
- Members-only areas (discussions, directory, events, research) require sign-in and are not public.

## About
${group(['/', '/about', '/faq'])}

## Membership
${group(['/eligibility', '/apply', '/verification-policy'])}

## Policies
${group(['/legal', '/privacy', '/terms', '/community-rules', '/clinical-disclaimer', '/copyright', '/grievance-policy', '/cookies'])}

## Contact
${group(['/contact'])}

## Optional
- [Full text for AI assistants](${SITE}/llms-full.txt): every public page and the FAQ in one plain-text file
- [Sitemap](${SITE}/sitemap.xml)
`;
fs.writeFileSync(path.join(dist, 'llms.txt'), llms);

const full = [
  `# ${seo.siteName} — full public content`,
  `Source: ${SITE}/ · Generated ${today} · Language: English (India)`,
  '',
  `> ${seo.organization.description}`,
  `> ${DISCLAIMER}`,
  '',
  '## Membership categories',
  ...membership.categories.map((c) => `- **${c.label}** — ${c.who} Needs: ${c.needs.join(', ')}. Badge after verification: ${c.badge}.`),
  '',
  '## Frequently asked questions',
  ...faq.items.flatMap((it) => [`### ${it.q}`, it.a, '']),
  ...seo.pages.filter((p) => !['/faq', '/login'].includes(p.path)).flatMap((p) => [
    `## ${p.h1}`,
    `URL: ${urlFor(p.path)}`,
    p.description,
    ...p.content.map((c) => `- ${c}`),
    '',
  ]),
].join('\n');
fs.writeFileSync(path.join(dist, 'llms-full.txt'), full);

// 6. IndexNow key file (https://www.indexnow.org)
if (INDEXNOW_KEY) {
  fs.writeFileSync(path.join(dist, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);
}

console.log(`SEO: ${count} pages + 404, sitemap.xml, robots.txt, llms.txt, llms-full.txt written for ${SITE}${GOOGLE_VERIFY ? ' (Google verification)' : ''}${BING_VERIFY ? ' (Bing verification)' : ''}`);

// 7. On Vercel production builds, tell IndexNow engines (Bing, Yandex, …) the URLs.
if (INDEXNOW_KEY && process.env.VERCEL_ENV === 'production') {
  const host = new URL(SITE).host;
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: seo.pages.map((p) => urlFor(p.path)) }),
      signal: AbortSignal.timeout(8000),
    });
    console.log(`IndexNow: submitted ${seo.pages.length} URLs (HTTP ${res.status})`);
  } catch (e) {
    console.log(`IndexNow: skipped (${e.message})`);
  }
}
