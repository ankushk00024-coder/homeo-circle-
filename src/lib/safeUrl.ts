/**
 * Link safety helpers.
 *
 * Links typed by members (website, LinkedIn, post sources) are shown to other
 * members, so only plain web links (http/https) are ever used. Anything else,
 * such as `javascript:` or `data:` links, is dropped. The database enforces
 * the same rule.
 */

const WEB_URL = /^https?:\/\/[^\s]+$/i;

/** Turns what a person typed into a web link: adds https:// to "example.com", drops unsafe links. */
export function normalizeUrl(input: string | null | undefined): string {
  const value = (input ?? '').trim();
  if (!value) return '';
  if (WEB_URL.test(value)) return value;
  // Has some other scheme (javascript:, data:, ftp: ...) → not allowed.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^:]+:\d/.test(value)) return '';
  const withScheme = `https://${value.replace(/^\/+/, '')}`;
  return WEB_URL.test(withScheme) ? withScheme : '';
}

/** Returns the link only if it is a safe web link, for use in href. */
export function safeHref(url: string | null | undefined): string | undefined {
  const value = (url ?? '').trim();
  return WEB_URL.test(value) ? value : undefined;
}
