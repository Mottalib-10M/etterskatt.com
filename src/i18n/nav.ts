import { route, ANNUAL, HOURLY, type Locale } from './routes';
import { formatNumber } from '../lib/format';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const L: Record<string, string> = {
  home: 'Lønnskalkulator 2026', skatt: 'Skattekalkulator', pensjonist: 'Skattekalkulator for pensjonister', lonn: 'Lønnskalkulator per måned', etterSkatt: 'Lønn etter skatt', netto: 'Fra netto til brutto', timelonn: 'Timelønn etter skatt',
  skattekort: 'Skattekort og skattetrekk', feriepenger: 'Feriepengekalkulator', overtid: 'Overtidskalkulator', kostnad: 'Kostnad for en ansatt', aga: 'Arbeidsgiveravgift',
  forskudd: 'Forskuddsskatt', formue: 'Formuesskatt', satser: 'Skattesatser 2026', trinnskatt: 'Trinnskatt', trygdeavgift: 'Trygdeavgift', fradrag: 'Fradrag',
  personfradrag: 'Personfradrag', minstefradrag: 'Minstefradrag', frikort: 'Frikort', halvSkatt: 'Skattefri juni og halv skatt', selvstendig: 'Skatt for næringsdrivende',
  minimumslonn: 'Minstelønn', snittlonn: 'Gjennomsnittslønn', glossary: 'Ordliste', method: 'Metode og kilder', widget: 'Bygg inn kalkulatoren',
  about: 'Om oss', contact: 'Kontakt', editorial: 'Redaksjonell policy', privacy: 'Personvern', terms: 'Vilkår', cookies: 'Informasjonskapsler',
};
export const label = (id: string, _l?: Locale) => L[id] ?? id;
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id) });
export const annualLabel = (a: number) => `${formatNumber(a)} kr i året`;
export const hourlyLabel = (a: number) => `${a} kr timen`;
export function navCategories(lang: Locale): NavCategory[] {
  return [
    { label: 'Kalkulatorer', links: ['home', 'skatt', 'pensjonist', 'lonn', 'etterSkatt', 'netto', 'timelonn', 'skattekort', 'feriepenger', 'overtid', 'kostnad', 'aga', 'forskudd', 'formue'].map((i) => link(i, lang)) },
    { label: 'Skatteguider', links: ['satser', 'trinnskatt', 'trygdeavgift', 'fradrag', 'personfradrag', 'minstefradrag', 'frikort', 'halvSkatt', 'selvstendig'].map((i) => link(i, lang)) },
    { label: 'Lønn', links: ['minimumslonn', 'snittlonn'].map((i) => link(i, lang)) },
    { label: 'Etter lønn', links: [...ANNUAL.map((a) => ({ href: route(`y-${a}`, lang), label: annualLabel(a) })), ...HOURLY.map((a) => ({ href: route(`h-${a}`, lang), label: hourlyLabel(a) }))] },
  ];
}
export const navDirect = (lang: Locale): NavLink[] => [link('method', lang)];
export const footerColumns = (lang: Locale): NavCategory[] => [...navCategories(lang).slice(0, 3), { label: 'Nettstedet', links: ['about', 'contact', 'editorial', 'method', 'glossary', 'widget', 'privacy', 'terms', 'cookies'].map((i) => link(i, lang)) }];
export const popularLinks = (lang: Locale): NavLink[] => [...ANNUAL.map((a) => ({ href: route(`y-${a}`, lang), label: annualLabel(a) })), ...HOURLY.map((a) => ({ href: route(`h-${a}`, lang), label: hourlyLabel(a) }))];
