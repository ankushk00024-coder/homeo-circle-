import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import seo from './pages.json';

/** Public site address (set VITE_SITE_URL in Vercel when a custom domain is added). */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || seo.defaultSiteUrl).replace(/\/+$/, '');

const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
};

const setCanonical = (href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
};

/**
 * Keeps the page title, description, canonical URL, social tags and robots
 * directive in step with the current route. Public pages come from
 * pages.json; member and admin pages are marked noindex.
 */
export const RouteSeo: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = seo.pages.find((p) => p.path === pathname);
    const isPrivate = seo.privatePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const home = seo.pages[0];

    const title = page?.title ?? (isPrivate ? `${seo.siteName}` : home.title);
    const description = page?.description ?? home.description;
    const url = `${SITE_URL}${page ? (page.path === '/' ? '/' : page.path) : pathname}`;

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', page && !isPrivate ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setCanonical(url);
  }, [pathname]);

  return null;
};
