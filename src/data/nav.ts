/**
 * Centralised navigation data for Header and Footer components.
 * All internal links use trailing slashes to match trailingSlash: 'always'.
 */

export interface NavLink {
  href: string;
  label: string;
}

export interface NavGroup {
  label: string;
  children: NavLink[];
}

// ---------------------------------------------------------------------------
// Header nav groups (desktop dropdowns + mobile accordions)
// ---------------------------------------------------------------------------

export const headerCalcLinks: Record<string, NavGroup> = {
  nb: {
    label: 'Kalkulatorer',
    children: [
      { href: '/', label: 'Lønnskalkulator' },
      { href: '/trinnskatt-kalkulator/', label: 'Trinnskattkalkulator' },
      { href: '/trygdeavgift-kalkulator/', label: 'Trygdeavgiftkalkulator' },
      { href: '/netto-til-brutto/', label: 'Netto til brutto' },
      { href: '/timelonn-kalkulator/', label: 'Timelønnkalkulator' },
      { href: '/kalkulatorer/', label: 'Alle kalkulatorer' },
    ],
  },
  en: {
    label: 'Calculators',
    children: [
      { href: '/en/', label: 'Salary Calculator' },
      { href: '/en/', label: 'All Calculators' },
    ],
  },
};

export const headerSalaryLinks: Record<string, NavGroup> = {
  nb: {
    label: 'Lønn',
    children: [
      { href: '/lonn/300000-kr/', label: '300 000 kr/år' },
      { href: '/lonn/400000-kr/', label: '400 000 kr/år' },
      { href: '/lonn/500000-kr/', label: '500 000 kr/år' },
      { href: '/lonn/600000-kr/', label: '600 000 kr/år' },
      { href: '/lonn/700000-kr/', label: '700 000 kr/år' },
      { href: '/lonn/800000-kr/', label: '800 000 kr/år' },
    ],
  },
};

export const headerGuideLinks: Record<string, NavGroup> = {
  nb: {
    label: 'Guider',
    children: [
      { href: '/guides/skattesatser-2025/', label: 'Skattesatser 2025' },
      { href: '/guides/', label: 'Alle guider' },
    ],
  },
  en: {
    label: 'Glossary',
    children: [
      { href: '/en/glossary/', label: 'Tax Glossary' },
    ],
  },
};

/** Build the full header nav items array for a given language. */
export function getHeaderNavItems(lang: string): NavGroup[] {
  if (lang === 'en') {
    return [headerCalcLinks.en, headerGuideLinks.en];
  }
  return [headerCalcLinks.nb, headerSalaryLinks.nb, headerGuideLinks.nb];
}

// ---------------------------------------------------------------------------
// Footer nav links (flat lists per column)
// ---------------------------------------------------------------------------

export const footerCalcLinks: Record<string, NavLink[]> = {
  nb: [
    { href: '/', label: 'Lønnskalkulator' },
    { href: '/trinnskatt-kalkulator/', label: 'Trinnskattkalkulator' },
    { href: '/trygdeavgift-kalkulator/', label: 'Trygdeavgiftkalkulator' },
    { href: '/netto-til-brutto/', label: 'Netto til brutto' },
    { href: '/timelonn-kalkulator/', label: 'Timelønnkalkulator' },
    { href: '/kalkulatorer/', label: 'Alle kalkulatorer' },
    { href: '/embed/', label: 'Widget' },
  ],
};

export const footerSalaryLinks: Record<string, NavLink[]> = {
  nb: [
    { href: '/lonn/400000-kr/', label: '400 000 kr/år' },
    { href: '/lonn/500000-kr/', label: '500 000 kr/år' },
    { href: '/lonn/600000-kr/', label: '600 000 kr/år' },
    { href: '/lonn/700000-kr/', label: '700 000 kr/år' },
    { href: '/lonn/800000-kr/', label: '800 000 kr/år' },
    { href: '/lonn/1000000-kr/', label: '1 000 000 kr/år' },
  ],
};

export const footerGuideLinks: Record<string, NavLink[]> = {
  nb: [
    { href: '/guides/skattesatser-2025/', label: 'Skattesatser 2025' },
    { href: '/guides/trinnskatt-forklart/', label: 'Trinnskatt forklart' },
    { href: '/guides/fradrag-i-norge/', label: 'Fradrag i Norge' },
    { href: '/ordliste/', label: 'Skatteordliste' },
    { href: '/guides/metode/', label: 'Var metode' },
    { href: '/guides/', label: 'Alle guider' },
    { href: '/nyheter/', label: 'Nyheter' },
  ],
};

export const footerInfoLinks: Record<string, NavLink[]> = {
  nb: [
    { href: '/om-oss/', label: 'Om oss' },
    { href: '/kontakt/', label: 'Kontakt' },
    { href: '/personvern/', label: 'Personvern' },
    { href: '/vilkar/', label: 'Vilkår' },
  ],
};
