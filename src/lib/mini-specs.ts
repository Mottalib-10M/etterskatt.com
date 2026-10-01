/** Mini-simulateurs des guides (RECETTE §9.3) : un par sujet, calculés par le moteur norvégien. */
import { compute, minstefradrag, trinnskatt, trinnRate, trygdeavgift, selfEmployed, sykepenger, foreldrepenger, dagpenger, mvaAdd, mvaRemove, bsuFradrag, reisefradrag, foreldrefradrag, ipsFradrag, restskatt, bonusSkatt, lonnsokning, aksjeskatt, utleieSkatt, fradragVerdi, seksG } from './engine/no';
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
  sykepenger: { title: 'Regn ut sykepengene dine', cta: 'Lønn etter skatt', inputs: [lonn()], run: ({ l }) => {
    const s = sykepenger({ gross: l }); return { head: ['Sykepenger per måned før skatt', kr(s.perMonth)], rows: [['Sykepengegrunnlag', kr(s.basis)], ['Per dag, fem dager i uken', kr(s.perDay)], ['Tap per måned over 6 G', kr(s.lossPerMonth)]], note: s.eligible ? (s.capped ? 'NAV dekker ikke inntekt over 6 G. Mange arbeidsgivere betaler mellomlegget.' : undefined) : 'Inntekten er under 0,5 G, som er minstekravet for sykepenger fra NAV.' };
  } },
  foreldrepenger: { title: 'Regn ut foreldrepengene dine', cta: 'Lønn etter skatt', inputs: [lonn(), { id: 'g', label: 'Dekningsgrad', def: 100, options: [{ value: '100', label: '100 % i 49 uker' }, { value: '80', label: '80 % i 61 uker og 1 dag' }] }], run: ({ l, g }) => {
    const f = foreldrepenger({ gross: l, grad: g === 80 ? 80 : 100 }); return { head: ['Foreldrepenger per måned før skatt', kr(f.perMonth)], rows: [['Samlet for hele perioden', kr(f.total)], ['Beregningsgrunnlag', kr(f.basis)], ['Tak på 6 G', kr(seksG)]] };
  } },
  dagpenger: { title: 'Regn ut dagpengene dine', cta: 'Lønn etter skatt', inputs: [{ id: 'l', label: 'Inntekt siste 12 måneder', def: 550000, unit: 'kr', max: 50000000 }, { id: 'b', label: 'Barn under 18 år du forsørger', def: 0, unit: 'barn', max: 15 }], run: ({ l, b }) => {
    const d = dagpenger({ income: l, children: b }); return { head: ['Dagpenger per måned før skatt', d.eligible ? kr(d.perMonth) : 'Ikke rett'], rows: [['Per dag, fem dager i uken', kr(d.perDay)], ['Stønadsperiode', `${d.weeks} uker`], ['Minsteinntekt siste 12 måneder', kr(d.minIncome)]] };
  } },
  mva: { title: 'Legg til eller trekk fra mva', cta: 'Skatt for næringsdrivende', inputs: [{ id: 'a', label: 'Beløp', def: 1000, unit: 'kr', max: 1000000000, decimals: 2 }, { id: 's', label: 'Mva-sats', def: P.mva.rate, options: [{ value: String(P.mva.rate), label: '25 % (alminnelig sats)' }, { value: String(P.mva.rate_food), label: '15 % (matvarer)' }, { value: String(P.mva.rate_low), label: '12 % (transport, overnatting, kino)' }] }, { id: 'm', label: 'Beløpet er', def: 0, options: [{ value: '0', label: 'Uten mva (legg til)' }, { value: '1', label: 'Med mva (trekk fra)' }] }], run: ({ a, s, m }) => {
    const x = m === 1 ? mvaRemove(a, s) : mvaAdd(a, s); return { head: [m === 1 ? 'Pris uten mva' : 'Pris med mva', kr(m === 1 ? x.ex : x.inc, 2)], rows: [['Merverdiavgift', kr(x.mva, 2)], ['Uten mva', kr(x.ex, 2)], ['Med mva', kr(x.inc, 2)]] };
  } },
  bsu: { title: 'Skattefradraget for BSU-sparingen din', cta: 'Skattekalkulator', inputs: [{ id: 's', label: 'Spart på BSU i år', def: P.bsu.max_year, unit: 'kr', max: 1000000 }, { id: 'a', label: 'Alderen din ved utgangen av året', def: 25, unit: 'år', max: 100 }], run: ({ s, a }) => {
    const b = bsuFradrag({ saved: s, age: a }); return { head: ['Mindre skatt i år', kr(b.credit)], rows: [['Beløp som teller', kr(b.counted)], ['Høyeste fradrag per år', kr(b.maxCredit)], ['Siste år med fradrag', `Året du fyller ${P.bsu.age_limit}`]] };
  } },
  rente: { title: 'Hva rentefradraget er verdt', cta: 'Skattekalkulator', inputs: [{ id: 'g', label: 'Lån', def: 3500000, unit: 'kr', max: 100000000 }, { id: 'r', label: 'Rente', def: 5.4, unit: '%', max: 30, decimals: 2 }], run: ({ g, r }) => {
    const renter = g * r / 100; const v = fradragVerdi(renter); return { head: ['Mindre skatt per år', kr(v)], rows: [['Renteutgifter per år', kr(renter)], ['Rente etter skatt', pct(r / 100 * (1 - P.alminnelig.rate), 2)], ['Per måned', kr(v / 12)]] };
  } },
  reise: { title: 'Regn ut reisefradraget ditt', cta: 'Skattekalkulator', inputs: [{ id: 'k', label: 'Avstand hjem til arbeid, én vei', def: 30, unit: 'km', max: 500, decimals: 1 }, { id: 'd', label: 'Arbeidsdager i året', def: 230, unit: 'dager', max: 366 }], run: ({ k, d }) => {
    const x = reisefradrag({ kmOneWay: k, days: d }); return { head: ['Mindre skatt i år', kr(x.saved)], rows: [['Reisefradrag etter egenandel', kr(x.fradrag)], ['Beregnet før egenandel', kr(x.gross)], ['Kilometer i året', new Intl.NumberFormat('nb-NO').format(Math.round(x.km))]] };
  } },
  foreldrefradrag: { title: 'Regn ut foreldrefradraget ditt', cta: 'Skattekalkulator', inputs: [{ id: 'n', label: 'Barn under 12 år', def: 2, unit: 'barn', max: 12 }, { id: 'c', label: 'Utgifter til barnepass i året', def: 44000, unit: 'kr', max: 2000000 }], run: ({ n, c }) => {
    const f = foreldrefradrag({ children: n, cost: c }); return { head: ['Mindre skatt i år', kr(f.saved)], rows: [['Foreldrefradrag', kr(f.fradrag)], ['Høyeste fradrag for dere', kr(f.max)], ['Skattesats på fradraget', pct(P.alminnelig.rate, 0)]] };
  } },
  ips: { title: 'Skatt spart med IPS', cta: 'Skattekalkulator', inputs: [{ id: 'i', label: 'Innskudd i IPS i år', def: P.ips.max, unit: 'kr', max: 1000000 }], run: ({ i }) => {
    const x = ipsFradrag(i); return { head: ['Mindre skatt i år', kr(x.saved)], rows: [['Fradrag som teller', kr(x.fradrag)], ['Høyeste innskudd med fradrag', kr(P.ips.max)], ['Skatt ved uttak som pensjonist', pct(P.alminnelig.rate, 0)]] };
  } },
  restskatt: { title: 'Hva restskatten koster med renter', cta: 'Skattekalkulator', inputs: [{ id: 'r', label: 'Restskatt i skatteoppgjøret', def: 20000, unit: 'kr', max: 50000000 }], run: ({ r }) => {
    const x = restskatt({ amount: r }); return { head: ['Å betale, med rentetillegg', kr(x.total)], rows: [['Rentetillegg', kr(x.rente)], ['Antall fakturaer', String(x.invoices)], ['Per faktura', kr(x.perInvoice)]] };
  } },
  bonus: { title: 'Bonusen din etter skatt', cta: 'Skattekalkulator', inputs: [lonn(700000), { id: 'b', label: 'Bonus før skatt', def: 50000, unit: 'kr', max: 50000000 }], run: ({ l, b }) => {
    const x = bonusSkatt({ gross: l, bonus: b }); return { head: ['Bonus etter skatt', kr(x.net)], rows: [['Skatt på bonusen', kr(x.tax)], ['Skatteprosent på bonusen', pct(x.rate, 1)], ['Gjennomsnittsskatt på lønnen', pct(A(l).effective, 1)]] };
  } },
  lonnsokning: { title: 'Lønnsøkningen din etter skatt', cta: 'Lønnskalkulator', inputs: [lonn(), { id: 'p', label: 'Lønnsøkning', def: 4.4, unit: '%', max: 200, decimals: 1 }], run: ({ l, p }) => {
    const x = lonnsokning({ gross: l, percent: p / 100 }); return { head: ['Mer utbetalt per måned', kr(x.netMonth)], rows: [['Ny årslønn', kr(x.newGross)], ['Økning før skatt', kr(x.extra)], ['Økning etter skatt', kr(x.net)], ['Andel du beholder', pct(x.kept, 0)]] };
  } },
  aksjer: { title: 'Skatt på aksjegevinst og utbytte', cta: 'Skattekalkulator', inputs: [{ id: 'g', label: 'Gevinst eller utbytte', def: 100000, unit: 'kr', max: 1000000000 }, { id: 's', label: 'Skjermingsfradrag', def: 0, unit: 'kr', max: 100000000 }], run: ({ g, s }) => {
    const x = aksjeskatt({ gain: g, skjerming: s }); return { head: ['Skatt å betale', kr(x.tax)], rows: [['Skattepliktig etter skjerming', kr(x.taxable)], ['Skattesats', pct(P.aksjer.rate, 2)], ['Du sitter igjen med', kr(x.net)]] };
  } },
  utleie: { title: 'Skatt på utleie av sekundærbolig', cta: 'Skattekalkulator', inputs: [{ id: 'r', label: 'Leieinntekter i året', def: 180000, unit: 'kr', max: 100000000 }, { id: 'c', label: 'Kostnader med fradrag', def: 60000, unit: 'kr', max: 100000000 }], run: ({ r, c }) => {
    const x = utleieSkatt({ rent: r, costs: c }); return { head: ['Skatt på utleien', kr(x.tax)], rows: [['Overskudd', kr(x.profit)], ['Skattesats', pct(P.alminnelig.rate, 0)], ['Igjen etter skatt', kr(x.net)]] };
  } },
};

export function getSpec(kind: string, _lang?: string): MiniSpec {
  const s = SPECS[kind]; if (!s) throw new Error(`Mini-simulateur inconnu : ${kind}`); return s;
}
