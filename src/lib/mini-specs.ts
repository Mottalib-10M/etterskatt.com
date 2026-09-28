/** Mini-simulateurs des guides (RECETTE §9.3) : un par sujet, calculés par le moteur norvégien. */
import { compute, minstefradrag, trinnskatt, trinnRate, trygdeavgift, selfEmployed } from './engine/no';
import P from '../data/params-2026.json';
import { formatMoney as kr, formatPercent as pct } from './format';
import type { MiniSpec } from './mini-types';

const lonn = (def = 600000) => ({ id: 'l', label: 'Bruttolønn per år', def, unit: 'kr', max: 50000000 });
const A = (g: number, o: Record<string, number> = {}) => compute({ gross: g, ...o }).annual;

const SPECS: Record<string, MiniSpec> = {
  trinnskatt: { title: 'Regn ut trinnskatten din', cta: 'Hele skatteberegningen', inputs: [lonn()], run: ({ l }) => {
    const t = trinnskatt(l); return { head: ['Trinnskatt i 2026', kr(t)], rows: [['Høyeste trinn du når', pct(trinnRate(l), 1)], ['Andel av lønnen', pct(l ? t / l : 0, 2)], ['Trinnskatt per måned', kr(t / 12)]] };
  } },
  trygdeavgift: { title: 'Regn ut trygdeavgiften din', cta: 'Hele skatteberegningen', inputs: [lonn()], run: ({ l }) => {
    const t = trygdeavgift(l); return { head: ['Trygdeavgift i 2026', kr(t)], rows: [['Sats på lønn', pct(P.trygdeavgift.wage, 1)], ['Nedre grense', kr(P.trygdeavgift.lower_limit)], ['Per måned', kr(t / 12)]] };
  } },
  minstefradrag: { title: 'Hvor stort blir minstefradraget ditt?', cta: 'Se hele skatten', inputs: [lonn()], run: ({ l }) => {
    const m = minstefradrag(l); return { head: ['Minstefradrag i 2026', kr(m)], rows: [['46 % av lønnen, maks', kr(P.minstefradrag.max)], ['Skatten går ned med (22 %)', kr(m * P.alminnelig.rate)], ['Taket nås ved en lønn på', kr(P.minstefradrag.max / P.minstefradrag.rate)]] };
  } },
  personfradrag: { title: 'Hva betyr personfradraget for deg?', cta: 'Se hele skatten', inputs: [lonn(450000)], run: ({ l }) => {
    const a = A(l); const verdi = Math.min(a.alminnelig, P.personfradrag) * P.alminnelig.rate;
    return { head: ['Personfradraget sparer deg', kr(verdi)], rows: [['Alminnelig inntekt', kr(a.alminnelig)], ['Personfradrag', kr(P.personfradrag)], ['Skatt på alminnelig inntekt', kr(a.skattAlminnelig)]] };
  } },
  fradrag: { title: 'Hvor mye er fradraget ditt verdt?', cta: 'Legg inn alle fradrag i skattekalkulatoren', inputs: [lonn(), { id: 'f', label: 'Fradrag, for eksempel renter', def: 30000, unit: 'kr', max: 5000000 }], run: ({ l, f }) => {
    const u = A(l); const m = A(l, { otherDeductions: f });
    return { head: ['Skatten går ned med', kr(u.totalTax - m.totalTax)], rows: [['Skatt uten fradraget', kr(u.totalTax)], ['Skatt med fradraget', kr(m.totalTax)], ['Verdi per 100 kr i fradrag', kr(f ? (u.totalTax - m.totalTax) / f * 100 : 0)]] };
  } },
  frikort: { title: 'Holder frikortet for inntekten din?', cta: 'Regn på lønn over frikortgrensen', inputs: [{ id: 'l', label: 'Inntekt i 2026', def: 80000, unit: 'kr', max: 10000000 }], run: ({ l }) => {
    const over = l - P.frikort_limit; const a = A(l);
    return { head: [over > 0 ? 'Over frikortgrensen med' : 'Under frikortgrensen med', kr(Math.abs(over))], rows: [['Frikortgrense', kr(P.frikort_limit)], ['Skatt på hele inntekten i året', kr(a.totalTax)], ['Utbetalt etter skatt', kr(a.net)]] };
  } },
  skattesatser: { title: 'Alle satsene brukt på lønnen din', cta: 'Hele skatteberegningen', inputs: [lonn()], run: ({ l }) => {
    const a = A(l); return { head: ['Samlet skatt i 2026', kr(a.totalTax)], rows: [['Skatt på alminnelig inntekt 22 %', kr(a.skattAlminnelig)], [`Trygdeavgift ${pct(P.trygdeavgift.wage, 1)}`, kr(a.trygdeavgift)], ['Trinnskatt', kr(a.trinnskatt)], ['Gjennomsnittsskatt', pct(l ? a.totalTax / l : 0)]] };
  } },
  desember: { title: 'Hva får du utbetalt i desember?', cta: 'Se lønnen måned for måned', inputs: [{ id: 'm', label: 'Månedslønn før skatt', def: 50000, unit: 'kr', max: 5000000 }], run: ({ m }) => {
    const T = compute({ gross: m * 12 }).tabell; return { head: ['Utbetalt i desember', kr(m - T.decemberTax)], rows: [['Utbetalt i en vanlig måned', kr(T.normalMonthNet)], ['Skattetrekk i en vanlig måned', kr(T.normalMonthTax)], ['Skattetrekk i desember (halv skatt)', kr(T.decemberTax)]] };
  } },
  snitt: { title: 'Sammenlign lønnen din med snittet', cta: 'Regn ut lønn etter skatt', inputs: [lonn(P.ssb.avg_month_nov2025 * 12)], run: ({ l }) => {
    const a = A(l); const snitt = P.ssb.avg_month_nov2025 * 12; const d = l / snitt - 1;
    return { head: ['Lønn etter skatt per måned', kr(a.net / 12)], rows: [['Mot gjennomsnittet (SSB)', `${d >= 0 ? '+' : '−'}${pct(Math.abs(d), 0)}`], ['Skatt per år', kr(a.totalTax)], ['Gjennomsnittsskatt', pct(l ? a.totalTax / l : 0)]] };
  } },
  timelonn: { title: 'Fra timelønn til lønn etter skatt', cta: 'Timelønnskalkulatoren', inputs: [{ id: 't', label: 'Timelønn', def: 250, unit: 'kr', max: 5000, decimals: 2 }, { id: 'u', label: 'Timer per uke', def: 37.5, unit: 't', max: 80, decimals: 1 }], run: ({ t, u }) => {
    const g = t * u * 52; const a = A(g); return { head: ['Lønn etter skatt per måned', kr(a.net / 12)], rows: [['Brutto per måned', kr(g / 12)], ['Brutto per år', kr(g)], ['Skatt per år', kr(a.totalTax)]] };
  } },
  naering: { title: 'Regn ut skatten på overskuddet', cta: 'Forskuddsskatt-kalkulatoren', inputs: [{ id: 'o', label: 'Overskudd fra næring per år', def: 600000, unit: 'kr', max: 50000000 }], run: ({ o }) => {
    const s = selfEmployed({ profit: o }); return { head: ['Skatt i 2026', kr(s.total)], rows: [['Per termin (fire terminer)', kr(s.perTerm)], [`Trygdeavgift ${pct(P.trygdeavgift.business, 1)}`, kr(s.trygdeavgift)], ['Igjen etter skatt', kr(s.net)]] };
  } },
};

export function getSpec(kind: string, _lang?: string): MiniSpec {
  const s = SPECS[kind]; if (!s) throw new Error(`Mini-simulateur inconnu : ${kind}`); return s;
}
