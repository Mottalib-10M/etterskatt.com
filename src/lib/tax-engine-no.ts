/**
 * Norwegian tax engine for 2025
 * Calculates income tax based on Skatteetaten rules
 */

import {
  TRINNSKATT_BRACKETS,
  TRYGDEAVGIFT,
  FELLESSKATT_RATE,
  MINSTEFRADRAG,
  PERSONFRADRAG,
} from '../data/tax-2025';

export interface TaxInput {
  bruttoAarlig: number;        // Gross annual salary in NOK
  kommuneRate?: number;        // Override fellesskatt rate (default 0.22)
}

export interface TrinnskattBand {
  name: string;
  min: number;
  max: number;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface TaxResult {
  bruttoAarlig: number;
  minstefradrag: number;
  personfradrag: number;
  alminneligInntekt: number;   // Ordinary income (after deductions)
  trinnskatt: number;
  trinnskattBands: TrinnskattBand[];
  trygdeavgift: number;
  fellesskatt: number;         // Kommune + fylke + fellesskatt
  totalSkatt: number;
  nettoAarlig: number;
  nettoMaanedlig: number;
  nettoAnnenhverUke: number;
  nettoUkentlig: number;
  effektivSkattesats: number;
  marginalsats: number;
}

/**
 * Calculate minstefradrag (minimum standard deduction)
 */
export function calculateMinstefradrag(brutto: number): number {
  if (brutto <= 0) return 0;
  const calculated = brutto * MINSTEFRADRAG.rate;
  return Math.min(Math.max(calculated, MINSTEFRADRAG.min), MINSTEFRADRAG.max);
}

/**
 * Calculate trinnskatt (bracket tax) on personal income
 */
export function calculateTrinnskatt(brutto: number): { total: number; bands: TrinnskattBand[] } {
  if (brutto <= 0) return { total: 0, bands: [] };

  let total = 0;
  const bands: TrinnskattBand[] = [];

  for (const bracket of TRINNSKATT_BRACKETS) {
    if (brutto <= bracket.min) break;

    const taxableAmount = Math.min(brutto, bracket.max === Infinity ? brutto : bracket.max) - bracket.min;
    const tax = taxableAmount * bracket.rate;

    if (bracket.rate > 0) {
      const maxDisplay = bracket.max === Infinity ? brutto : bracket.max;
      bands.push({
        name: `${formatKr(bracket.min)} – ${bracket.max === Infinity ? '∞' : formatKr(maxDisplay)}`,
        min: bracket.min,
        max: bracket.max,
        rate: bracket.rate * 100,
        taxableAmount,
        tax,
      });
    }

    total += tax;
  }

  return { total, bands };
}

/**
 * Calculate trygdeavgift (social security contribution)
 */
export function calculateTrygdeavgift(brutto: number): number {
  if (brutto <= TRYGDEAVGIFT.threshold) return 0;
  // Phase-in rule: tax cannot exceed 25.8% of income above threshold
  const fullTax = brutto * TRYGDEAVGIFT.rate;
  const phaseInLimit = (brutto - TRYGDEAVGIFT.threshold) * TRYGDEAVGIFT.lowerRate;
  return Math.min(fullTax, phaseInLimit);
}

/**
 * Calculate fellesskatt (kommune + fylke tax) on alminnelig inntekt
 */
export function calculateKommuneskatt(alminneligInntekt: number, rate: number = FELLESSKATT_RATE): number {
  if (alminneligInntekt <= 0) return 0;
  return alminneligInntekt * rate;
}

/**
 * Main calculation: compute full tax breakdown and take-home pay
 */
export function calculateTakeHome(input: TaxInput): TaxResult {
  const brutto = Math.max(0, input.bruttoAarlig);
  const kommuneRate = input.kommuneRate ?? FELLESSKATT_RATE;

  // 1. Deductions
  const minstefradrag = calculateMinstefradrag(brutto);
  const personfradrag = PERSONFRADRAG;

  // 2. Alminnelig inntekt (ordinary income)
  const alminneligInntekt = Math.max(0, brutto - minstefradrag - personfradrag);

  // 3. Trinnskatt (on personinntekt = gross salary)
  const { total: trinnskatt, bands: trinnskattBands } = calculateTrinnskatt(brutto);

  // 4. Trygdeavgift (on personinntekt = gross salary)
  const trygdeavgift = calculateTrygdeavgift(brutto);

  // 5. Fellesskatt (on alminnelig inntekt)
  const fellesskatt = calculateKommuneskatt(alminneligInntekt, kommuneRate);

  // 6. Total tax
  const totalSkatt = trinnskatt + trygdeavgift + fellesskatt;

  // 7. Net pay
  const nettoAarlig = Math.max(0, brutto - totalSkatt);

  // 8. Effective and marginal rates
  const effektivSkattesats = brutto > 0 ? (totalSkatt / brutto) * 100 : 0;
  const marginalsats = calculateMarginalRate(brutto, kommuneRate);

  return {
    bruttoAarlig: brutto,
    minstefradrag,
    personfradrag,
    alminneligInntekt,
    trinnskatt,
    trinnskattBands,
    trygdeavgift,
    fellesskatt,
    totalSkatt,
    nettoAarlig,
    nettoMaanedlig: nettoAarlig / 12,
    nettoAnnenhverUke: nettoAarlig / 26,
    nettoUkentlig: nettoAarlig / 52,
    effektivSkattesats,
    marginalsats,
  };
}

/**
 * Calculate marginal tax rate at a given income level
 */
function calculateMarginalRate(brutto: number, kommuneRate: number): number {
  if (brutto <= 0) return 0;
  const increment = 1000;
  const tax1 = getTotalTax(brutto, kommuneRate);
  const tax2 = getTotalTax(brutto + increment, kommuneRate);
  return ((tax2 - tax1) / increment) * 100;
}

function getTotalTax(brutto: number, kommuneRate: number): number {
  const minstefradrag = calculateMinstefradrag(brutto);
  const alminneligInntekt = Math.max(0, brutto - minstefradrag - PERSONFRADRAG);
  const trinnskatt = calculateTrinnskatt(brutto).total;
  const trygdeavgift = calculateTrygdeavgift(brutto);
  const fellesskatt = calculateKommuneskatt(alminneligInntekt, kommuneRate);
  return trinnskatt + trygdeavgift + fellesskatt;
}

/**
 * Reverse calculation: find gross salary needed for a desired net salary
 */
export function calculateRequiredGross(targetNet: number, kommuneRate: number = FELLESSKATT_RATE): number {
  if (targetNet <= 0) return 0;

  // Binary search
  let low = targetNet;
  let high = targetNet * 3;
  let iterations = 0;

  while (high - low > 1 && iterations < 100) {
    const mid = Math.floor((low + high) / 2);
    const result = calculateTakeHome({ bruttoAarlig: mid, kommuneRate });
    if (result.nettoAarlig < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
    iterations++;
  }

  return high;
}

function formatKr(value: number): string {
  return new Intl.NumberFormat('nb-NO').format(value) + ' kr';
}
