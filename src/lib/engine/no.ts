/**
 * Moteur norvégien 2026 : fonctions pures, tous les paramètres lus dans params-2026.json.
 * Salarié (lønnstaker) en skatteklasse 1 : skatt på alminnelig inntekt, trygdeavgift, trinnskatt.
 */
import P from '../../data/params-2026.json';

export type Period = 'monthly' | 'biweekly' | 'weekly' | 'annual';
export type Zone = keyof typeof P.aga.zones;
export const PERIODS = P.periods as Record<Period, number>;
const r0 = (x: number) => Math.round(x);
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Minstefradrag sur salaire : 46 %, plafonné. */
export const minstefradrag = (wage: number) => r0(Math.min(Math.max(0, wage) * P.minstefradrag.rate, P.minstefradrag.max));

/** Trinnskatt sur la personinntekt (brut). */
export function trinnskatt(personinntekt: number): number {
  let tax = 0; const T = P.trinnskatt;
  for (let i = 0; i < T.length; i++) {
    const lo = T[i].from; const hi = i + 1 < T.length ? T[i + 1].from : Infinity;
    if (personinntekt > lo) tax += (Math.min(personinntekt, hi) - lo) * T[i].rate;
  }
  return r0(tax);
}
export function trinnRate(personinntekt: number): number {
  let rate = 0; for (const t of P.trinnskatt) if (personinntekt > t.from) rate = t.rate; return rate;
}

/** Trygdeavgift : taux plein, jamais plus de 25 % de la part au-dessus de la limite basse. */
export function trygdeavgift(base: number, rate: number = P.trygdeavgift.wage): number {
  const T = P.trygdeavgift;
  if (base <= T.lower_limit) return 0;
  return r0(Math.min(base * rate, (base - T.lower_limit) * T.phase_in));
}

export interface Input {
  gross: number;              // bruttolønn per år
  tiltakssone?: boolean;      // Finnmark et Nord-Troms : 18,5 % sur alminnelig inntekt
  reducedTrygd?: boolean;     // moins de 17 ans ou plus de 69 ans : 5,1 %
  union?: number;             // fagforeningskontingent payée
  interest?: number;          // renteutgifter
  otherDeductions?: number;   // autres fradrag i alminnelig inntekt
  bsu?: number;               // épargne BSU de l'année
  period?: Period;
}
export interface Result {
  period: Period; n: number;
  annual: { gross: number; minstefradrag: number; deductions: number; alminnelig: number; skattAlminnelig: number; trygdeavgift: number; trinnskatt: number; bsuCredit: number; totalTax: number; net: number; effective: number; marginal: number };
  perPeriod: { gross: number; tax: number; net: number };
  tabell: { normalMonthTax: number; normalMonthNet: number; decemberTax: number };
}

function core(i: Input) {
  const gross = Math.max(0, i.gross);
  const mf = minstefradrag(gross);
  const union = Math.min(Math.max(0, i.union ?? 0), P.fagforening_max);
  const deductions = r0(union + Math.max(0, i.interest ?? 0) + Math.max(0, i.otherDeductions ?? 0));
  const alminnelig = Math.max(0, gross - mf - deductions);
  const rate = i.tiltakssone ? P.alminnelig.rate_tiltakssone : P.alminnelig.rate;
  const skattAlminnelig = r0(Math.max(0, alminnelig - P.personfradrag) * rate);
  const tg = trygdeavgift(gross, i.reducedTrygd ? P.trygdeavgift.reduced_age : P.trygdeavgift.wage);
  const tr = trinnskatt(gross);
  const bsuCredit = r0(Math.min(Math.min(Math.max(0, i.bsu ?? 0), P.bsu.max_year) * P.bsu.rate, skattAlminnelig));
  const totalTax = skattAlminnelig + tg + tr - bsuCredit;
  return { gross, minstefradrag: mf, deductions, alminnelig, skattAlminnelig, trygdeavgift: tg, trinnskatt: tr, bsuCredit, totalTax, net: gross - totalTax };
}

export function compute(i: Input): Result {
  const period = i.period ?? 'annual'; const n = PERIODS[period];
  const a = core(i);
  const up = core({ ...i, gross: a.gross + 1000 });
  const marginal = (up.totalTax - a.totalTax) / 1000;
  // Tabelltrekk : l'impôt de l'année est réparti sur 10,5 mois (juin sans trekk, décembre à moitié).
  const normalMonthTax = r0(a.totalTax / P.tabelltrekk_months);
  return {
    period, n,
    annual: { ...a, effective: a.gross > 0 ? a.totalTax / a.gross : 0, marginal },
    perPeriod: { gross: r2(a.gross / n), tax: r2(a.totalTax / n), net: r2(a.net / n) },
    tabell: { normalMonthTax, normalMonthNet: r0(a.gross / 12 - normalMonthTax), decemberTax: r0(normalMonthTax / 2) },
  };
}

/** Brut nécessaire pour un net annuel donné (recherche par dichotomie). */
export function grossForNet(net: number, o: Omit<Input, 'gross'> = {}): number {
  if (net <= 0) return 0;
  let lo = net, hi = net * 2.5 + 50000;
  for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (core({ ...o, gross: mid }).net < net) lo = mid; else hi = mid; }
  return r0(hi);
}

/** Feriepenger : 10,2 % (ou 12 % avec cinq semaines), plus 2,3 points dès 60 ans, sur la base plafonnée à 6 G pour le supplément.
 *  Ferieloven § 10 (3) : G au 31 décembre de l'année d'acquisition, soit le G du 1er mai 2026 pour 2026. */
export function feriepenger(o: { basis: number; fiveWeeks?: boolean; over60?: boolean; g?: number }) {
  const F = P.feriepenger; const g = o.g ?? P.grunnbelop.from_2026_05_01;
  const rate = o.fiveWeeks ? F.rate_5_weeks : F.rate;
  const base = r0(Math.max(0, o.basis) * rate);
  const extra = o.over60 ? r0(Math.min(Math.max(0, o.basis), F.extra_60_cap_g * g) * F.extra_60) : 0;
  return { rate, base, extra, total: base + extra };
}

/** Heures supplémentaires : supplément d'au moins 40 %, net calculé au taux marginal réel. */
export function overtime(o: { gross: number; hours: number; supplement?: number; hourly?: number }) {
  const hourly = o.hourly ?? o.gross / P.overtid.hours_year;
  const sup = o.supplement ?? P.overtid.min_supplement;
  const pay = r0(Math.max(0, o.hours) * hourly * (1 + sup));
  const before = core({ gross: o.gross }); const after = core({ gross: o.gross + pay });
  const tax = after.totalTax - before.totalTax;
  return { hourly: r2(hourly), overtimeRate: r2(hourly * (1 + sup)), pay, tax, net: pay - tax };
}

/** Coût employeur : salaire, OTP minimale, feriepenger en sus si demandé (salarié horaire), arbeidsgiveravgift sur le tout. */
export function employerCost(o: { gross: number; zone?: Zone; otpRate?: number; feriepengerOnTop?: boolean; g?: number }) {
  const g = o.g ?? P.grunnbelop.from_2026_05_01;
  const otp = r0(Math.min(o.gross, P.otp_min.cap_g * g) * (o.otpRate ?? P.otp_min.rate));
  const fp = o.feriepengerOnTop ? r0(o.gross * P.feriepenger.rate) : 0;
  const rate = P.aga.zones[o.zone ?? '1'];
  const aga = r0((o.gross + fp + otp) * rate);
  return { gross: o.gross, feriepenger: fp, otp, agaRate: rate, aga, total: o.gross + fp + otp + aga };
}

/** Selvstendig næringsdrivende : personinntekt = résultat, trygdeavgift 10,8 %, pas de minstefradrag. */
export function selfEmployed(o: { profit: number; deductions?: number; tiltakssone?: boolean }) {
  const profit = Math.max(0, o.profit);
  const alminnelig = Math.max(0, profit - Math.max(0, o.deductions ?? 0));
  const rate = o.tiltakssone ? P.alminnelig.rate_tiltakssone : P.alminnelig.rate;
  const skattAlminnelig = r0(Math.max(0, alminnelig - P.personfradrag) * rate);
  const tg = trygdeavgift(profit, P.trygdeavgift.business);
  const tr = trinnskatt(profit);
  const total = skattAlminnelig + tg + tr;
  return { profit, skattAlminnelig, trygdeavgift: tg, trinnskatt: tr, total, perTerm: r0(total / P.forskuddsskatt_terms.length), net: profit - total };
}

/** Formuesskatt : 1,0 % au-dessus du bunnfradrag, 1,1 % au-dessus du seuil haut ; seuils doublés pour un couple. */
export function formuesskatt(o: { netWealth: number; married?: boolean }) {
  const F = P.formue; const k = o.married ? 2 : 1;
  const w = Math.max(0, o.netWealth);
  const low = Math.max(0, Math.min(w, F.high_from * k) - F.bunnfradrag * k) * F.rate;
  const high = Math.max(0, w - F.high_from * k) * F.high_rate;
  return { tax: r0(low + high), taxable: Math.max(0, w - F.bunnfradrag * k) };
}
/** Valeur fiscale d'une résidence principale : 25 % jusqu'à 10 M, 70 % au-delà. */
export function primaryHomeValue(market: number): number {
  const F = P.formue; const m = Math.max(0, market);
  return r0(Math.min(m, F.primary_home_limit) * F.primary_home_rate + Math.max(0, m - F.primary_home_limit) * F.primary_home_rate_above);
}

export const hourlyToAnnual = (h: number, hoursPerYear = P.overtid.hours_year) => h * hoursPerYear;

/** Alderspensjonist (folketrygd, offentlig AFP) : minstefradrag 40 %, trygdeavgift 5,1 %, skattefradrag for pensjonsinntekt. */
export function pensionTax(o: { pension: number; months?: number; grad?: number; interest?: number }) {
  const pension = Math.max(0, o.pension);
  const f = Math.min(1, Math.max(0, o.grad ?? 1)) * Math.min(12, Math.max(1, o.months ?? 12)) / 12;
  const mf = r0(Math.min(pension * P.minstefradrag.pension_rate, P.minstefradrag.pension_max));
  const alminnelig = Math.max(0, pension - mf - Math.max(0, o.interest ?? 0));
  const skattAlminnelig = r0(Math.max(0, alminnelig - P.personfradrag) * P.alminnelig.rate);
  const tr = trinnskatt(pension);
  const tg = trygdeavgift(pension, P.trygdeavgift.pension);
  const Q = P.pensjon;
  const reduction = Q.sats1 * Math.max(0, Math.min(pension, Q.trinn2 * f) - Q.trinn1 * f) + Q.sats2 * Math.max(0, pension - Q.trinn2 * f);
  const beforeCap = r0(Math.max(0, Q.skattefradrag_max * f - reduction));
  const skattefradrag = Math.min(beforeCap, skattAlminnelig + tr + tg);
  const totalTax = skattAlminnelig + tr + tg - skattefradrag;
  return { pension, minstefradrag: mf, alminnelig, skattAlminnelig, trinnskatt: tr, trygdeavgift: tg, skattefradrag, totalTax, net: pension - totalTax, monthlyNet: (pension - totalTax) / 12, effective: pension > 0 ? totalTax / pension : 0 };
}

/* ----- NAV-ytelser, fradrag og kapitalskatt : pages ajoutées le 2026-10-01 ----- */
const G = P.grunnbelop.from_2026_05_01;
export const seksG = P.nav.cap_g * G;
/** Sykepenger : 100 % du revenu jusqu'à 6 G ; l'employeur paie les 16 premiers jours, NAV ensuite, 52 semaines au plus. */
export function sykepenger(o: { gross: number }) {
  const gross = Math.max(0, o.gross); const basis = Math.min(gross, seksG);
  const eligible = gross >= P.nav.sykepenger.min_income_g * G;
  return { eligible, basis, perYear: eligible ? basis : 0, perMonth: eligible ? r0(basis / 12) : 0, perDay: eligible ? r0(basis / 260) : 0, lossPerMonth: eligible ? r0((gross - basis) / 12) : 0, capped: gross > seksG };
}
/** Foreldrepenger : 49 semaines à 100 % ou 61 semaines et 1 jour à 80 %, sur un revenu plafonné à 6 G. */
export function foreldrepenger(o: { gross: number; grad?: 100 | 80 }) {
  const F = P.nav.foreldrepenger; const grad = o.grad ?? 100;
  const basis = Math.min(Math.max(0, o.gross), seksG); const weeks = grad === 100 ? F.weeks_100 : F.weeks_80;
  const perDay = (basis / 260) * (grad / 100);
  return { basis, weeks, perMonth: r0((basis / 12) * (grad / 100)), total: r0(perDay * 5 * weeks), capped: o.gross > seksG };
}
/** Dagpenger : 62,4 % du revenu jusqu'à 6 G, si l'on a gagné 1,5 G sur 12 mois ; 104 semaines à partir de 2 G, 52 sinon. */
export function dagpenger(o: { income: number; children?: number }) {
  const D = P.nav.dagpenger; const income = Math.max(0, o.income);
  const eligible = income >= D.min_12m_g * G; const basis = Math.min(income, seksG);
  const child = Math.max(0, Math.floor(o.children ?? 0)) * D.child_per_day * D.days_per_year;
  const perYear = eligible ? r0(basis * D.rate + child) : 0;
  return { eligible, basis, perYear, perMonth: r0(perYear / 12), perDay: eligible ? r0(perYear / D.days_per_year) : 0, weeks: income >= D.long_from_g * G ? D.weeks_long : D.weeks_short, minIncome: r0(D.min_12m_g * G) };
}
/** MVA : ajouter la taxe à un prix hors taxe ou l'extraire d'un prix toutes taxes. */
export const mvaAdd = (ex: number, rate: number = P.mva.rate) => { const e = Math.max(0, ex); const mva = r2(e * rate); return { ex: r2(e), mva, inc: r2(e + mva) }; };
export const mvaRemove = (inc: number, rate: number = P.mva.rate) => { const i = Math.max(0, inc); const mva = r2(i * rate / (1 + rate)); return { inc: r2(i), mva, ex: r2(i - mva) }; };
/** BSU : 10 % du montant épargné dans l'année, jusqu'à 27 500 kr, jusqu'à l'année des 33 ans. */
export function bsuFradrag(o: { saved: number; age: number; ownsHome?: boolean }) {
  const B = P.bsu; const ok = o.age <= B.age_limit && !o.ownsHome;
  const counted = ok ? Math.min(Math.max(0, o.saved), B.max_year) : 0;
  return { eligible: ok, counted, credit: r0(counted * B.rate), maxCredit: r0(B.max_year * B.rate) };
}
/** Valeur fiscale d'un fradrag i alminnelig inntekt : 22 % (18,5 % dans la tiltakssone). */
export const fradragVerdi = (amount: number, tiltakssone = false) => r0(Math.max(0, amount) * (tiltakssone ? P.alminnelig.rate_tiltakssone : P.alminnelig.rate));
/** Reisefradrag : aller-retour × jours × 1,90 kr, plafonné à 120 000 kr, moins la franchise de 12 000 kr. */
export function reisefradrag(o: { kmOneWay: number; days?: number }) {
  const R = P.reisefradrag; const days = o.days ?? 230;
  const km = Math.max(0, o.kmOneWay) * 2 * Math.max(0, days);
  const gross = Math.min(r0(km * R.rate_per_km), R.max);
  const fradrag = Math.max(0, gross - R.threshold);
  return { km, gross, fradrag, saved: fradragVerdi(fradrag), breakEvenKm: R.threshold / (R.rate_per_km * 2 * days) };
}
/** Foreldrefradrag : frais de garde documentés, 15 000 kr pour un enfant et 10 000 kr par enfant suivant. */
export function foreldrefradrag(o: { children: number; cost: number }) {
  const F = P.foreldrefradrag; const n = Math.max(0, Math.floor(o.children));
  const max = n > 0 ? F.first + F.each_additional * (n - 1) : 0;
  const fradrag = Math.min(Math.max(0, o.cost), max);
  return { max, fradrag, saved: fradragVerdi(fradrag) };
}
/** IPS : versement déductible jusqu'à 15 000 kr par an. */
export const ipsFradrag = (deposit: number) => { const f = Math.min(Math.max(0, deposit), P.ips.max); return { fradrag: f, saved: fradragVerdi(f) }; };
/** Restskatt : supplément d'intérêt, et partage en deux factures à partir de 1 000 kr. */
export function restskatt(o: { amount: number }) {
  const R = P.restskatt; const a = Math.max(0, o.amount);
  const rente = r0(a * R.rentetillegg_2025); const total = a + rente; const split = total >= R.split_from;
  return { rente, total, invoices: split ? 2 : 1, perInvoice: split ? r0(total / 2) : total };
}
/** Bonus ou sluttvederlag : imposé comme du salaire, donc au taux marginal. */
export function bonusSkatt(o: { gross: number; bonus: number }) {
  const a = core({ gross: o.gross }); const b = core({ gross: o.gross + Math.max(0, o.bonus) });
  const tax = b.totalTax - a.totalTax; const bonus = Math.max(0, o.bonus);
  return { tax, net: bonus - tax, rate: bonus > 0 ? tax / bonus : 0 };
}
/** Hausse de salaire : ce qu'il en reste après impôt. */
export function lonnsokning(o: { gross: number; percent: number }) {
  const extra = r0(Math.max(0, o.gross) * o.percent); const x = bonusSkatt({ gross: o.gross, bonus: extra });
  return { newGross: o.gross + extra, extra, net: x.net, netMonth: r0(x.net / 12), kept: extra > 0 ? x.net / extra : 0 };
}
/** Gain ou dividende sur actions : 22 % × 1,72 = 37,84 %, après skjermingsfradrag. */
export function aksjeskatt(o: { gain: number; skjerming?: number }) {
  const taxable = Math.max(0, o.gain - Math.max(0, o.skjerming ?? 0));
  const tax = r0(taxable * P.aksjer.rate);
  return { taxable, tax, net: o.gain - tax };
}
/** Location d'un logement secondaire : 22 % du bénéfice. */
export function utleieSkatt(o: { rent: number; costs: number }) {
  const profit = Math.max(0, o.rent) - Math.max(0, o.costs);
  const tax = profit > 0 ? r0(profit * P.alminnelig.rate) : 0;
  return { profit, tax, net: profit - tax };
}
/** Location de courte durée de son propre logement (moins de 30 jours) : 85 % au-delà de 15 000 kr. */
export const korttidsutleie = (rent: number) => { const U = P.utleie; const taxable = r0(Math.max(0, rent - U.short_free) * U.short_share); return { taxable, tax: r0(taxable * P.alminnelig.rate) }; };
