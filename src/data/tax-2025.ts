/**
 * Norwegian tax rates for 2025
 * Source: Skatteetaten (https://www.skatteetaten.no)
 *
 * All amounts in NOK (Norwegian Kroner)
 */

/** Trinnskatt (bracket tax) thresholds and rates for 2025 */
export const TRINNSKATT_BRACKETS = [
  { min: 0,         max: 217_400,    rate: 0 },
  { min: 217_400,   max: 306_050,    rate: 0.017 },
  { min: 306_050,   max: 697_150,    rate: 0.040 },
  { min: 697_150,   max: 942_400,    rate: 0.136 },
  { min: 942_400,   max: 1_410_750,  rate: 0.166 },
  { min: 1_410_750, max: Infinity,   rate: 0.176 },
] as const;

/** Trygdeavgift (social security contribution) */
export const TRYGDEAVGIFT = {
  rate: 0.079,
  threshold: 69_650,    // No trygdeavgift below this
  lowerRate: 0.258,     // Rate on income between threshold and full phase-in
} as const;

/** Fellesskatt (common tax = kommuneskatt + fylkesskatt) */
export const FELLESSKATT_RATE = 0.22;

/** Minstefradrag (minimum standard deduction) for lønnsinntekt */
export const MINSTEFRADRAG = {
  rate: 0.46,
  min: 4_000,
  max: 114_950,
} as const;

/** Personfradrag (personal allowance) for Klasse 1 */
export const PERSONFRADRAG = 70_000;

/** Standard kommune tax rates (approximate) */
export const KOMMUNE_RATES: Record<string, { name: string; rate: number }> = {
  'oslo':        { name: 'Oslo',          rate: 0.22 },
  'bergen':      { name: 'Bergen',        rate: 0.22 },
  'trondheim':   { name: 'Trondheim',    rate: 0.22 },
  'stavanger':   { name: 'Stavanger',     rate: 0.22 },
  'tromsø':      { name: 'Tromsø',       rate: 0.22 },
  'kristiansand':{ name: 'Kristiansand',  rate: 0.22 },
  'drammen':     { name: 'Drammen',       rate: 0.22 },
  'fredrikstad': { name: 'Fredrikstad',   rate: 0.22 },
  'sandnes':     { name: 'Sandnes',       rate: 0.22 },
  'bodø':        { name: 'Bodø',          rate: 0.22 },
} as const;

export const ALL_KOMMUNER = Object.keys(KOMMUNE_RATES);

/** Pay period labels in Norwegian */
export const LØNNSPERIODER = {
  yearly:    { label: 'Årlig',      periods: 1 },
  monthly:   { label: 'Månedlig',   periods: 12 },
  biweekly:  { label: 'Annenhver uke', periods: 26 },
  weekly:    { label: 'Ukentlig',   periods: 52 },
} as const;

export type Lønnsperiode = keyof typeof LØNNSPERIODER;
