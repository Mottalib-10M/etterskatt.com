import { describe, it, expect } from 'vitest';
import { compute, trinnskatt, trygdeavgift, minstefradrag, feriepenger, employerCost, formuesskatt, selfEmployed, grossForNet, overtime, primaryHomeValue, pensionTax } from './no';

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

describe('alderspensjonist 2026', () => {
  it('ingen skatt på en lav alderspensjon : skattefradraget dekker alt', () => {
    const r = pensionTax({ pension: 240000 });
    expect(r.minstefradrag).toBe(75400);
    expect(r.skattefradrag).toBe(r.skattAlminnelig + r.trinnskatt + r.trygdeavgift);
    expect(r.totalTax).toBe(0);
  });
  it('400 000 kr : fradrag 37 100 − 16,7 % × (400 000 − 284 950)', () => {
    const r = pensionTax({ pension: 400000 });
    expect(r.skattefradrag).toBe(17887);
    expect(r.trygdeavgift).toBe(20400);
    expect(r.totalTax).toBeCloseTo(46213 + r.trinnskatt + 20400 - 17887, 0);
  });
  it('fradraget faller bort over omtrent 620 000 kr', () => {
    expect(pensionTax({ pension: 650000 }).skattefradrag).toBe(0);
    expect(pensionTax({ pension: 600000 }).skattefradrag).toBeGreaterThan(0);
  });
  it('avkortes forholdsmessig etter uttaksgrad og måneder', () => {
    const r = pensionTax({ pension: 80000, grad: 0.5, months: 6 });
    // maks 37 100 × 0,25 = 9 275 ; innslagspunkt 284 950 × 0,25 = 71 237,5
    expect(r.skattefradrag).toBeLessThanOrEqual(Math.round(9275 - 0.167 * (80000 - 71237.5)));
  });
});


import { sykepenger, foreldrepenger, dagpenger, mvaAdd, mvaRemove, bsuFradrag, reisefradrag, foreldrefradrag, ipsFradrag, restskatt, bonusSkatt, lonnsokning, aksjeskatt, utleieSkatt, korttidsutleie, seksG } from './no';
describe('Pages ajoutées le 2026-10-01 (NAV, Skatteetaten)', () => {
  it('6 G = 819 294 kr (chiffre publié par NAV)', () => expect(seksG).toBe(819294));
  it('sykepenger : plafonnés à 6 G', () => { expect(sykepenger({ gross: 600000 }).perYear).toBe(600000); const s = sykepenger({ gross: 1000000 }); expect(s.perYear).toBe(819294); expect(s.capped).toBe(true); expect(sykepenger({ gross: 50000 }).eligible).toBe(false); });
  it('foreldrepenger : 49 semaines à 100 %, 61 semaines et 1 jour à 80 %', () => { const a = foreldrepenger({ gross: 600000 }); expect(a.weeks).toBe(49); expect(a.total).toBeCloseTo(600000 / 260 * 245, -1); const b = foreldrepenger({ gross: 600000, grad: 80 }); expect(b.perMonth).toBe(40000); expect(Math.abs(b.total - a.total)).toBeLessThan(1000); });
  it('dagpenger : 62,4 % jusqu’à 6 G ; seuil 1,5 G = 204 824 kr (NAV)', () => { expect(dagpenger({ income: 500000 }).perYear).toBe(312000); expect(dagpenger({ income: 500000 }).weeks).toBe(104); expect(dagpenger({ income: 250000 }).weeks).toBe(52); expect(dagpenger({ income: 200000 }).eligible).toBe(false); expect(dagpenger({ income: 1 }).minIncome).toBe(204824); expect(dagpenger({ income: 500000, children: 2 }).perYear).toBe(312000 + 2 * 38 * 260); });
  it('MVA : 1 000 kr + 25 % = 1 250 kr ; 1 250 kr contient 250 kr ; matvarer 15 %', () => { expect(mvaAdd(1000).inc).toBe(1250); expect(mvaRemove(1250).mva).toBe(250); expect(mvaAdd(100, 0.15).inc).toBe(115); expect(mvaRemove(112, 0.12).ex).toBe(100); });
  it('BSU : 2 750 kr au maximum, rien après 33 ans ni avec un logement', () => { expect(bsuFradrag({ saved: 27500, age: 25 }).credit).toBe(2750); expect(bsuFradrag({ saved: 40000, age: 25 }).credit).toBe(2750); expect(bsuFradrag({ saved: 27500, age: 34 }).credit).toBe(0); expect(bsuFradrag({ saved: 27500, age: 25, ownsHome: true }).credit).toBe(0); });
  it('reisefradrag : 30 km × 2 × 230 jours × 1,90 kr − 12 000 kr', () => { const r = reisefradrag({ kmOneWay: 30 }); expect(r.gross).toBe(26220); expect(r.fradrag).toBe(14220); expect(r.saved).toBe(3128); expect(reisefradrag({ kmOneWay: 10 }).fradrag).toBe(0); expect(reisefradrag({ kmOneWay: 200 }).gross).toBe(120000); });
  it('foreldrefradrag : 15 000 + 10 000 par enfant suivant', () => { expect(foreldrefradrag({ children: 1, cost: 40000 }).fradrag).toBe(15000); expect(foreldrefradrag({ children: 3, cost: 40000 }).fradrag).toBe(35000); expect(foreldrefradrag({ children: 2, cost: 12000 }).saved).toBe(2640); });
  it('IPS : 15 000 kr → 3 300 kr d’impôt en moins', () => expect(ipsFradrag(20000).saved).toBe(3300));
  it('restskatt : 3,12 % et deux factures à partir de 1 000 kr', () => { const r = restskatt({ amount: 20000 }); expect(r.rente).toBe(624); expect(r.invoices).toBe(2); expect(r.perInvoice).toBe(10312); expect(restskatt({ amount: 500 }).invoices).toBe(1); });
  it('bonus : imposé au taux marginal', () => { const b = bonusSkatt({ gross: 700000, bonus: 50000 }); expect(b.rate).toBeGreaterThan(0.33); expect(b.rate).toBeLessThan(0.48); expect(lonnsokning({ gross: 600000, percent: 0.05 }).extra).toBe(30000); });
  it('actions : 37,84 % après skjermingsfradrag', () => { expect(aksjeskatt({ gain: 100000 }).tax).toBe(37840); expect(aksjeskatt({ gain: 100000, skjerming: 5000 }).tax).toBe(35948); });
  it('utleie : 22 % du bénéfice ; courte durée 85 % au-delà de 15 000 kr', () => { expect(utleieSkatt({ rent: 180000, costs: 60000 }).tax).toBe(26400); expect(utleieSkatt({ rent: 50000, costs: 60000 }).tax).toBe(0); expect(korttidsutleie(55000).taxable).toBe(34000); expect(korttidsutleie(10000).tax).toBe(0); });
});
