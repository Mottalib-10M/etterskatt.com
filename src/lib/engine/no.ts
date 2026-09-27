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
