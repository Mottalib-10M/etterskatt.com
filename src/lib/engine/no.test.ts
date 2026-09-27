import { describe, it, expect } from 'vitest';
import { compute, trinnskatt, trygdeavgift, minstefradrag, feriepenger, employerCost, formuesskatt, selfEmployed, grossForNet, overtime, primaryHomeValue } from './no';

describe('lønnstaker 2026, skatteklasse 1', () => {
  it('600 000 kr : calcul manuel avec les satser de Forskuddsutskrivingen 2026', () => {
    const r = compute({ gross: 600000 }).annual;
    expect(r.minstefradrag).toBe(95700);
    expect(r.alminnelig).toBe(504300);
    expect(r.skattAlminnelig).toBe(85747);   // (504 300 − 114 540) × 22 %
    expect(r.trygdeavgift).toBe(45600);      // 7,6 %
    expect(r.trinnskatt).toBe(12835);        // 92 200 × 1,7 % + 281 700 × 4,0 %
    expect(r.totalTax).toBe(144182);
    expect(r.net).toBe(455818);
  });
  it('1 000 000 kr : quatre paliers de trinnskatt', () => {
    const r = compute({ gross: 1000000 }).annual;
    expect(r.trinnskatt).toBe(56122);
    expect(r.totalTax).toBe(305869);
    expect(r.marginal).toBeCloseTo(0.22 + 0.076 + 0.168, 3);
  });
  it('100 000 kr (frikort) : seulement la trygdeavgift plafonnée à 25 %', () => {
    const r = compute({ gross: 100000 }).annual;
    expect(r.skattAlminnelig).toBe(0);
    expect(r.trygdeavgift).toBe(88);
    expect(r.totalTax).toBe(88);
  });
  it('minstefradrag plafonné à 95 700', () => { expect(minstefradrag(100000)).toBe(46000); expect(minstefradrag(300000)).toBe(95700); });
  it('trinnskatt nulle sous 226 100', () => { expect(trinnskatt(226100)).toBe(0); expect(trinnskatt(318300)).toBe(1567); });
  it('trygdeavgift nulle sous la limite basse', () => { expect(trygdeavgift(99650)).toBe(0); expect(trygdeavgift(120000)).toBe(5088); });
  it('tiltakssone : 18,5 %', () => { expect(compute({ gross: 600000, tiltakssone: true }).annual.skattAlminnelig).toBe(72106); });
  it('fagforening plafonné à 8 700', () => { expect(compute({ gross: 600000, union: 12000 }).annual.deductions).toBe(8700); });
  it('BSU : 10 % de 27 500 au plus', () => { expect(compute({ gross: 600000, bsu: 40000 }).annual.bsuCredit).toBe(2750); });
  it('tabelltrekk sur 10,5 mois', () => { const t = compute({ gross: 600000 }).tabell; expect(t.normalMonthTax).toBe(13732); expect(t.normalMonthNet).toBe(36268); });
  it('grossForNet retrouve le brut', () => { expect(Math.abs(grossForNet(455818) - 600000)).toBeLessThanOrEqual(1); });
});
describe('autres calculs', () => {
  it('feriepenger 10,2 % et supplément 60 ans', () => { const f = feriepenger({ basis: 600000, over60: true }); expect(f.base).toBe(61200); expect(f.extra).toBe(13800); });
  it('supplément 60 ans plafonné à 6 G', () => { expect(feriepenger({ basis: 1000000, over60: true }).extra).toBe(Math.round(6 * 136549 * 0.023)); });
  it('coût employeur zone 1', () => { const e = employerCost({ gross: 600000 }); expect(e.otp).toBe(12000); expect(e.aga).toBe(86292); expect(e.total).toBe(698292); });
  it('coût employeur zone 5 sans aga', () => { expect(employerCost({ gross: 600000, zone: '5' }).aga).toBe(0); });
  it('formuesskatt', () => { expect(formuesskatt({ netWealth: 3000000 }).tax).toBe(11000); expect(formuesskatt({ netWealth: 30000000 }).tax).toBe(289500); expect(formuesskatt({ netWealth: 3000000, married: true }).tax).toBe(0); });
  it('bolig : 25 % puis 70 %', () => { expect(primaryHomeValue(12000000)).toBe(3900000); });
  it('næringsdrivende 600 000', () => { const s = selfEmployed({ profit: 600000 }); expect(s.trygdeavgift).toBe(64800); expect(s.total).toBe(184436); });
  it('overtid 40 %', () => { const o = overtime({ gross: 585000, hours: 10 }); expect(o.hourly).toBe(300); expect(o.pay).toBe(4200); });
});
