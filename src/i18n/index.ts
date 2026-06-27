import { nb } from './nb';
import { en } from './en';

export const translations = { nb, en } as const;
export type Locale = keyof typeof translations;

export function t(locale: Locale = 'nb') {
  return translations[locale];
}

export function getLocale(url: URL): Locale {
  const path = url.pathname;
  if (path.startsWith('/en/') || path === '/en') return 'en';
  return 'nb';
}
