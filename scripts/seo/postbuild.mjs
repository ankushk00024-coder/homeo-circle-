// Runs after `vite build`. Using src/seo/pages.json it writes, into dist/:
//  * one HTML file per public page (e.g. dist/about/index.html) with that
//    page's title, description, canonical URL, social tags, structured data
//    and readable content, so search engines and link previews see real
//    content without running JavaScript (React replaces it on load);
//  * sitemap.xml and robots.txt.
// The site address comes from VITE_SITE_URL (set it in Vercel for a custom
// domain); the Google Search Console code from VITE_GOOGLE_SITE_VERIFICATION.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dist = path.join(root, 'dist');
const seo = JSON.parse(fs.readFileSync(path.join(root, 'src/seo/pages.json'), 'utf8'));

const SITE = (process.env.VITE_SITE_URL || seo.defaultSiteUrl).replace(/\/+$/, '');
const VERIFY = (process.env.VITE_GOOGLE_SITE_VERIFICATION || '').trim();
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlFor = (p) => `${SITE}${p === '/' ? '/' : p}`;

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const organization = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: seo.siteName,
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png`, width: 512, height: 512 },
  description: seo.organization.description,
  email: seo.organization.email,
  areaServed: { '@type': 'Country', name: 'India' },
  ...(seo.organization.sameAs.length ? { sameAs: seo.organization.sameAs } : {}),
};
const website = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: seo.siteName,
  alternateName: ['HomeoIndia', 'Homeo India Community'],
  url: `${SITE}/`,
  inLanguage: 'en-IN',
  publisher: { '@id': `${SITE}/#organization` },
};

function jsonLdFor(page) {
  const graph = [organization, website];
  graph.push({
    '@type': page.path === '/about' ? 'AboutPage' : 'WebPage',
    '@id': `${urlFor(page.path)}#webpage`,
    url: urlFor(page.path),
    name: page.title,
    description: page.description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE}/#website` },
    about: { '@id': `${SITE}/#organization` },
    primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}${seo.ogImage}` },
  });
  if (page.path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: seo.siteName, item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: page.h1, item: urlFor(page.path) },
      ],
    });
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

function prerenderFor(page) {
  const links = page.links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join('');
  const paras = page.content.map((p) => `<p>${esc(p)}</p>`).join('');
  return `<main class="seo-prerender" style="max-width:44rem;margin:0 auto;padding:3rem 1.25rem;font-family:system-ui,sans-serif;color:#14243F;line-height:1.6">` +
    `<p style="letter-spacing:.14em;font-weight:700">HOMEO <span style="color:#0D817B">INDIA</span></p>` +
    `<h1 style="font-size:2rem;line-height:1.2">${esc(page.h1)}</h1>${paras}<ul>${links}</ul></main>`;
}

function pageHtml(page) {
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
    .replace('<!--__JSON_LD__-->', jsonLdFor(page))
    .replace('<!--__PRERENDER__-->', prerenderFor(page));
  return html;
}

function finalize(html) {
  return html
    .replaceAll('__SITE_URL__', SITE)
    .replace('<!--__GOOGLE_SITE_VERIFICATION__-->', VERIFY ? `<meta name="google-site-verification" content="${esc(VERIFY)}" />` : '')
    .replace('<!--__JSON_LD__-->', '')
    .replace('<!--__PRERENDER__-->', '');
}

// 1. Per-page HTML (the home page overwrites dist/index.html, which is also
//    the fallback for app routes; those get noindex at runtime).
let count = 0;
for (const page of seo.pages) {
  const out = page.path === '/' ? path.join(dist, 'index.html') : path.join(dist, page.path.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, finalize(pageHtml(page)));
  count++;
}

// 2. sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${seo.pages.map((p) => `  <url>
    <loc>${urlFor(p.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority.toFixed(1)}</priority>${p.path === '/' ? `
    <image:image><image:loc>${SITE}${seo.ogImage}</image:loc></image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

// 3. robots.txt
const robots = `# Homeo India — ${SITE}
User-agent: *
Allow: /
${seo.privatePaths.map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${SITE}/sitemap.xml
`;
fs.writeFileSync(path.join(dist, 'robots.txt'), robots);

console.log(`SEO: ${count} pages, sitemap.xml and robots.txt written for ${SITE}${VERIFY ? ' (with Google verification)' : ''}`);
