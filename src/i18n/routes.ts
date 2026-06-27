/**
 * Bidirectional route mapping between Norwegian (nb) and English (en) pages.
 * Used to generate hreflang alternate links.
 */

const nbToEn: Record<string, string> = {
  '/': '/en/',
  '/ordliste/': '/en/glossary/',
};

const enToNb: Record<string, string> = {};
for (const [nb, en] of Object.entries(nbToEn)) {
  enToNb[en] = nb;
}

/**
 * Given the current page path and its language, returns the path of the
 * alternate-language version, or null if no mapping exists.
 */
export function getAlternatePath(
  currentPath: string,
  currentLang: 'nb' | 'en',
): string | null {
  const path = currentPath.endsWith('/') ? currentPath : currentPath + '/';
  if (currentLang === 'nb') return nbToEn[path] ?? null;
  return enToNb[path] ?? null;
}
