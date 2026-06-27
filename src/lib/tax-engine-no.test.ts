import { describe, it, expect } from 'vitest';
import {
  calculateMinstefradrag,
  calculateTrinnskatt,
  calculateTrygdeavgift,
  calculateKommuneskatt,
  calculateTakeHome,
  calculateRequiredGross,
} from './tax-engine-no';

describe('calculateMinstefradrag', () => {
  it('returns 0 for zero income', () => {
    expect(calculateMinstefradrag(0)).toBe(0);
  });

  it('returns minimum 4000 for very low income', () => {
    // 46% of 5000 = 2300, but min is 4000
    expect(calculateMinstefradrag(5000)).toBe(4000);
  });

  it('returns 46% for moderate income', () => {
    // 46% of 200000 = 92000 (within range)
    expect(calculateMinstefradrag(200000)).toBe(92000);
  });

  it('caps at 114950 for high income', () => {
    // 46% of 500000 = 230000, but max is 114950
    expect(calculateMinstefradrag(500000)).toBe(114950);
  });

  it('returns 0 for negative income', () => {
    expect(calculateMinstefradrag(-50000)).toBe(0);
  });
});

describe('calculateTrinnskatt', () => {
  it('returns 0 below first threshold', () => {
    const { total } = calculateTrinnskatt(200000);
    expect(total).toBe(0);
  });

  it('calculates step 1 only for income at 250000', () => {
    const { total, bands } = calculateTrinnskatt(250000);
    // (250000 - 217400) * 0.017 = 32600 * 0.017 = 554.2
    expect(total).toBeCloseTo(554.2, 1);
    expect(bands).toHaveLength(1);
  });

  it('calculates steps 1 and 2 for 500000', () => {
    const { total, bands } = calculateTrinnskatt(500000);
    const step1 = (306050 - 217400) * 0.017;  // 88650 * 0.017 = 1507.05
    const step2 = (500000 - 306050) * 0.040;  // 193950 * 0.040 = 7758.00
    expect(total).toBeCloseTo(step1 + step2, 1);
    expect(bands).toHaveLength(2);
  });

  it('calculates all 5 steps for 2000000', () => {
    const { bands } = calculateTrinnskatt(2000000);
    expect(bands).toHaveLength(5);
  });

  it('returns 0 for zero income', () => {
    const { total } = calculateTrinnskatt(0);
    expect(total).toBe(0);
  });

  it('step 3 rate is 13.6%', () => {
    const { bands } = calculateTrinnskatt(800000);
    const step3 = bands.find(b => Math.abs(b.rate - 13.6) < 0.01);
    expect(step3).toBeDefined();
    expect(step3!.taxableAmount).toBeCloseTo(800000 - 697150, 0);
  });
});

describe('calculateTrygdeavgift', () => {
  it('returns 0 below threshold (69650)', () => {
    expect(calculateTrygdeavgift(50000)).toBe(0);
  });

  it('uses phase-in rule for income just above threshold', () => {
    // At 75000: full = 75000*0.079=5925, phase-in = (75000-69650)*0.258=1379.7
    const result = calculateTrygdeavgift(75000);
    expect(result).toBeCloseTo(1380.3, 0);
  });

  it('calculates 7.9% for standard income', () => {
    // At 550000: full=43450, phase-in=(550000-69650)*0.258=123929.7
    // Min(43450, 123929.7) = 43450
    const result = calculateTrygdeavgift(550000);
    expect(result).toBeCloseTo(550000 * 0.079, 0);
  });

  it('returns 0 for zero income', () => {
    expect(calculateTrygdeavgift(0)).toBe(0);
  });
});

describe('calculateKommuneskatt', () => {
  it('returns 0 for zero alminnelig inntekt', () => {
    expect(calculateKommuneskatt(0)).toBe(0);
  });

  it('returns 22% of positive alminnelig inntekt', () => {
    expect(calculateKommuneskatt(300000)).toBeCloseTo(66000, 0);
  });

  it('returns 0 for negative alminnelig inntekt', () => {
    expect(calculateKommuneskatt(-50000)).toBe(0);
  });
});

describe('calculateTakeHome', () => {
  it('returns correct structure', () => {
    const result = calculateTakeHome({ bruttoAarlig: 550000 });
    expect(result).toHaveProperty('bruttoAarlig');
    expect(result).toHaveProperty('minstefradrag');
    expect(result).toHaveProperty('personfradrag');
    expect(result).toHaveProperty('alminneligInntekt');
    expect(result).toHaveProperty('trinnskatt');
    expect(result).toHaveProperty('trygdeavgift');
    expect(result).toHaveProperty('fellesskatt');
    expect(result).toHaveProperty('totalSkatt');
    expect(result).toHaveProperty('nettoAarlig');
    expect(result).toHaveProperty('nettoMaanedlig');
    expect(result).toHaveProperty('effektivSkattesats');
    expect(result).toHaveProperty('marginalsats');
  });

  it('net pay is always less than gross for positive income', () => {
    const result = calculateTakeHome({ bruttoAarlig: 550000 });
    expect(result.nettoAarlig).toBeLessThan(result.bruttoAarlig);
    expect(result.nettoAarlig).toBeGreaterThan(0);
  });

  it('calculates correct deductions for 550000', () => {
    const result = calculateTakeHome({ bruttoAarlig: 550000 });
    // Minstefradrag: min(550000*0.46, 114950) = 114950
    expect(result.minstefradrag).toBe(114950);
    // Personfradrag: 70000
    expect(result.personfradrag).toBe(70000);
    // Alminnelig inntekt: 550000 - 114950 - 70000 = 365050
    expect(result.alminneligInntekt).toBe(365050);
  });

  it('total tax equals sum of components', () => {
    const result = calculateTakeHome({ bruttoAarlig: 600000 });
    const sum = result.trinnskatt + result.trygdeavgift + result.fellesskatt;
    expect(result.totalSkatt).toBeCloseTo(sum, 0);
  });

  it('net + total tax = gross', () => {
    const result = calculateTakeHome({ bruttoAarlig: 750000 });
    expect(result.nettoAarlig + result.totalSkatt).toBeCloseTo(result.bruttoAarlig, 0);
  });

  it('monthly is annual divided by 12', () => {
    const result = calculateTakeHome({ bruttoAarlig: 500000 });
    expect(result.nettoMaanedlig).toBeCloseTo(result.nettoAarlig / 12, 0);
  });

  it('effective rate is between 0 and 100', () => {
    const result = calculateTakeHome({ bruttoAarlig: 500000 });
    expect(result.effektivSkattesats).toBeGreaterThan(0);
    expect(result.effektivSkattesats).toBeLessThan(100);
  });

  it('effective rate around 25-28% for typical 550000 salary', () => {
    const result = calculateTakeHome({ bruttoAarlig: 550000 });
    expect(result.effektivSkattesats).toBeGreaterThan(24);
    expect(result.effektivSkattesats).toBeLessThan(30);
  });

  it('handles zero gross', () => {
    const result = calculateTakeHome({ bruttoAarlig: 0 });
    expect(result.nettoAarlig).toBe(0);
    expect(result.totalSkatt).toBe(0);
    expect(result.effektivSkattesats).toBe(0);
  });

  it('higher income has higher effective rate', () => {
    const low = calculateTakeHome({ bruttoAarlig: 400000 });
    const high = calculateTakeHome({ bruttoAarlig: 1000000 });
    expect(high.effektivSkattesats).toBeGreaterThan(low.effektivSkattesats);
  });
});

describe('calculateRequiredGross', () => {
  it('returns gross that produces target net (within 100 kr)', () => {
    const targetNet = 400000;
    const gross = calculateRequiredGross(targetNet);
    const result = calculateTakeHome({ bruttoAarlig: gross });
    expect(Math.abs(result.nettoAarlig - targetNet)).toBeLessThan(100);
  });

  it('returns 0 for zero target', () => {
    expect(calculateRequiredGross(0)).toBe(0);
  });

  it('required gross is always higher than target net', () => {
    const targetNet = 350000;
    const gross = calculateRequiredGross(targetNet);
    expect(gross).toBeGreaterThan(targetNet);
  });

  it('works for high target net', () => {
    const targetNet = 800000;
    const gross = calculateRequiredGross(targetNet);
    const result = calculateTakeHome({ bruttoAarlig: gross });
    expect(Math.abs(result.nettoAarlig - targetNet)).toBeLessThan(100);
  });
});
