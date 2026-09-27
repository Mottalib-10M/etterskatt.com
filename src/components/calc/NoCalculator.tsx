import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import StackedBar from '../ui/StackedBar';
import { compute, grossForNet, feriepenger, overtime, employerCost, selfEmployed, formuesskatt, type Period, type Zone } from '../../lib/engine/no';
import P from '../../data/params-2026.json';
import { formatMoney, formatPercent, formatNumber } from '../../lib/format';
import { readParams, num, str, updateURL } from '../../lib/url-state';

export type Mode = 'lonn' | 'skatt' | 'etterSkatt' | 'netto' | 'timelonn' | 'skattekort' | 'feriepenger' | 'overtid' | 'kostnad' | 'aga' | 'forskudd' | 'formue';
interface Props { mode?: Mode; initialGross?: number; initialHourly?: number; initialPeriod?: Period; methodHref?: string }
const PERIOD_OPTS = [{ value: 'monthly', label: 'Per måned' }, { value: 'biweekly', label: 'Hver 14. dag' }, { value: 'weekly', label: 'Per uke' }, { value: 'annual', label: 'Per år' }];
const PER: Record<Period, string> = { monthly: 'per måned', biweekly: 'hver 14. dag', weekly: 'per uke', annual: 'per år' };
const ZONE_OPTS = (Object.keys(P.aga.zones) as Zone[]).map((z) => ({ value: z, label: `Sone ${z.toUpperCase()} (${formatPercent(P.aga.zones[z], 1)})` }));
const OTP_OPTS = [0.02, 0.03, 0.04, 0.05, 0.07].map((r) => ({ value: String(r), label: `${formatPercent(r, 0)}${r === 0.02 ? ' (lovens minimum)' : ''}` }));
const SUP_OPTS = [0.4, 0.5, 1].map((r) => ({ value: String(r), label: `${formatPercent(r, 0)} tillegg${r === 0.4 ? ' (minimum)' : ''}` }));
const YN = [{ value: '0', label: 'Nei' }, { value: '1', label: 'Ja' }];

export default function NoCalculator({ mode = 'lonn', initialGross = 600000, initialHourly = 300, initialPeriod = 'monthly', methodHref }: Props) {
  const sp = new URLSearchParams(); // premier rendu = HTML du build (RECETTE §17.5)
  const [gross, setGross] = useState(num(sp, 'l', initialGross));
  const [net, setNet] = useState(num(sp, 'n', 450000));
  const [hourly, setHourly] = useState(num(sp, 't', initialHourly));
  const [hours, setHours] = useState(num(sp, 'tu', 37.5));
  const [period, setPeriod] = useState<Period>(str(sp, 'p', initialPeriod) as Period);
  const [tz, setTz] = useState(str(sp, 'tz', '0'));
  const [union, setUnion] = useState(num(sp, 'fk', 0));
  const [interest, setInterest] = useState(num(sp, 'r', 0));
  const [bsu, setBsu] = useState(num(sp, 'bsu', 0));
  const [five, setFive] = useState(str(sp, 'f5', '0'));
  const [o60, setO60] = useState(str(sp, 'o60', '0'));
  const [otH, setOtH] = useState(num(sp, 'ot', 10));
  const [sup, setSup] = useState(str(sp, 'ts', '0.4'));
  const [zone, setZone] = useState<Zone>(str(sp, 'z', '1') as Zone);
  const [otp, setOtp] = useState(str(sp, 'otp', '0.02'));
  const [fpTop, setFpTop] = useState(str(sp, 'fp', '0'));
  const [ded, setDed] = useState(num(sp, 'fr', 0));
  const [married, setMarried] = useState(str(sp, 'gift', '0'));
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const u = readParams(window.location.search);
    setGross(num(u, 'l', initialGross)); setNet(num(u, 'n', 450000)); setHourly(num(u, 't', initialHourly)); setHours(num(u, 'tu', 37.5));
    setPeriod(str(u, 'p', initialPeriod) as Period); setTz(str(u, 'tz', '0')); setUnion(num(u, 'fk', 0)); setInterest(num(u, 'r', 0)); setBsu(num(u, 'bsu', 0));
    setFive(str(u, 'f5', '0')); setO60(str(u, 'o60', '0')); setOtH(num(u, 'ot', 10)); setSup(str(u, 'ts', '0.4'));
    setZone(str(u, 'z', '1') as Zone); setOtp(str(u, 'otp', '0.02')); setFpTop(str(u, 'fp', '0')); setDed(num(u, 'fr', 0)); setMarried(str(u, 'gift', '0'));
  }, []);
  const tiltak = tz === '1';
  const effGross = mode === 'netto' ? grossForNet(net, { tiltakssone: tiltak }) : mode === 'timelonn' ? Math.round(hourly * hours * 52) : gross;
  const r = useMemo(() => compute({ gross: effGross, tiltakssone: tiltak, union, interest, bsu, period }), [effGross, tiltak, union, interest, bsu, period]);
  const fp = useMemo(() => feriepenger({ basis: gross, fiveWeeks: five === '1', over60: o60 === '1' }), [gross, five, o60]);
  const ot = useMemo(() => overtime({ gross, hours: otH, supplement: Number(sup) }), [gross, otH, sup]);
  const ec = useMemo(() => employerCost({ gross, zone, otpRate: Number(otp), feriepengerOnTop: fpTop === '1' }), [gross, zone, otp, fpTop]);
  const se = useMemo(() => selfEmployed({ profit: gross, deductions: ded, tiltakssone: tiltak }), [gross, ded, tiltak]);
  const fs = useMemo(() => formuesskatt({ netWealth: gross, married: married === '1' }), [gross, married]);
  useEffect(() => { updateURL({ l: ['netto', 'timelonn'].includes(mode) ? undefined : gross, n: mode === 'netto' ? net : undefined, t: mode === 'timelonn' ? hourly : undefined, tu: mode === 'timelonn' && hours !== 37.5 ? hours : undefined, p: period === initialPeriod ? undefined : period, tz: tz === '1' ? 1 : undefined, fk: union || undefined, r: interest || undefined, bsu: bsu || undefined, f5: five === '1' ? 1 : undefined, o60: o60 === '1' ? 1 : undefined, ot: mode === 'overtid' ? otH : undefined, ts: mode === 'overtid' && sup !== '0.4' ? sup : undefined, z: zone === '1' ? undefined : zone, otp: otp === '0.02' ? undefined : otp, fp: fpTop === '1' ? 1 : undefined, fr: ded || undefined, gift: married === '1' ? 1 : undefined }); }, [gross, net, hourly, hours, period, tz, union, interest, bsu, five, o60, otH, sup, zone, otp, fpTop, ded, married, mode]);

  const A = r.annual; const pp = r.perPeriod; const per = PER[period]; const T = r.tabell;
  const head = (() => {
    switch (mode) {
      case 'skatt': return { l: 'Samlet skatt for 2026', v: formatMoney(A.totalTax), s: `gjennomsnittlig ${formatPercent(A.effective)} · marginalskatt ${formatPercent(A.marginal)}` };
      case 'etterSkatt': return { l: 'Utbetalt i en vanlig måned (tabelltrekk)', v: formatMoney(T.normalMonthNet), s: `${formatMoney(A.gross / 12)} brutto − skattetrekk ${formatMoney(T.normalMonthTax)} · juni uten trekk, halv skatt i desember` };
      case 'netto': return { l: 'Nødvendig bruttolønn per år', v: formatMoney(effGross), s: `for ${formatMoney(net)} per år etter skatt · ${formatMoney(effGross / 12)} per måned` };
      case 'timelonn': return { l: `Lønn etter skatt ${per}`, v: formatMoney(pp.net), s: `${formatMoney(effGross)} per år for ${hours} timer i uken à ${formatMoney(hourly, 2)}` };
      case 'skattekort': return { l: 'Omtrentlig prosentsats på skattekortet', v: formatPercent(A.effective, 1), s: `skattetrekk ${formatMoney(T.normalMonthTax)} i en vanlig måned (tabelltrekk over 10,5 måneder)` };
      case 'feriepenger': return { l: 'Feriepenger som utbetales i 2027', v: formatMoney(fp.total), s: `${formatPercent(fp.rate, 1)} av feriepengegrunnlaget${fp.extra ? ` + ${formatMoney(fp.extra)} for 60 år og over` : ''}` };
      case 'overtid': return { l: `Overtidsbetaling etter skatt for ${otH} timer`, v: formatMoney(ot.net), s: `${formatMoney(ot.pay)} brutto à ${formatMoney(ot.overtimeRate, 2)} per time · skatt ${formatMoney(ot.tax)}` };
      case 'kostnad': return { l: 'Kostnad for arbeidsgiver per år', v: formatMoney(ec.total), s: `${formatMoney(ec.total / 12)} per måned · ${formatPercent(ec.total / Math.max(1, ec.gross) - 1, 1)} over lønnen` };
      case 'aga': return { l: `Arbeidsgiveravgift i sone ${zone.toUpperCase()}`, v: formatMoney(ec.aga), s: `${formatPercent(ec.agaRate, 1)} av lønn${ec.feriepenger ? ', feriepenger' : ''} og pensjonsinnskudd` };
      case 'forskudd': return { l: 'Forskuddsskatt for 2026', v: formatMoney(se.total), s: `fire terminer à omtrent ${formatMoney(se.perTerm)} · ${P.forskuddsskatt_terms.join(', ')}` };
      case 'formue': return { l: 'Formuesskatt for 2026', v: formatMoney(fs.tax), s: `skattepliktig formue over bunnfradraget: ${formatMoney(fs.taxable)}` };
      default: return { l: `Lønn etter skatt ${per}`, v: formatMoney(pp.net), s: `${formatMoney(pp.gross)} brutto − skatt ${formatMoney(pp.tax)} · ${formatPercent(A.effective)} i gjennomsnitt` };
    }
  })();
  const copy = async () => { try { await navigator.clipboard.writeText(`${head.l}: ${head.v}\n${window.location.href}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* indisponible */ } };
  const incomeLabel = mode === 'feriepenger' ? 'Feriepengegrunnlag (lønn opptjent i 2026)' : mode === 'forskudd' ? 'Overskudd fra næring per år' : mode === 'formue' ? 'Nettoformue (skattemessig verdi)' : 'Bruttolønn per år';
  const taxModes: Mode[] = ['lonn', 'skatt', 'etterSkatt', 'netto', 'timelonn', 'skattekort'];

  return (
    <div data-chrome className="rechner rounded-xl border border-navy-200 bg-navy-50 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <form className="space-y-4 lg:col-span-2" onSubmit={(e) => e.preventDefault()}>
          {mode === 'netto' ? <NumberField id="n" label="Ønsket lønn etter skatt per år" value={net} onChange={setNet} unit="kr" max={20000000} help="Etter trinnskatt, trygdeavgift og skatt på alminnelig inntekt" />
            : mode === 'timelonn' ? (
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="t" label="Timelønn" value={hourly} onChange={setHourly} unit="kr" max={5000} decimals={2} help="Før skatt" />
                <NumberField id="tu" label="Timer per uke" value={hours} onChange={setHours} unit="t" max={80} decimals={1} />
              </div>)
            : <NumberField id="l" label={incomeLabel} value={gross} onChange={setGross} unit="kr" max={mode === 'formue' ? 1000000000 : 50000000} />}
          {taxModes.includes(mode) && <div className="grid grid-cols-2 gap-3">
            <SelectField id="p" label="Vis beløp" value={period} onChange={(v) => setPeriod(v as Period)} options={PERIOD_OPTS} />
            <Toggle id="tz" label="Finnmark eller Nord-Troms?" options={YN} value={tz} onChange={setTz} />
          </div>}
          {['skatt', 'skattekort'].includes(mode) && <div className="grid grid-cols-2 gap-3">
            <NumberField id="r" label="Renteutgifter per år" value={interest} onChange={setInterest} unit="kr" max={5000000} />
            <NumberField id="fk" label="Fagforeningskontingent" value={union} onChange={setUnion} unit="kr" max={100000} help={`Fradrag inntil ${formatMoney(P.fagforening_max)}`} />
          </div>}
          {mode === 'skatt' && <NumberField id="bsu" label="Sparing i BSU i år" value={bsu} onChange={setBsu} unit="kr" max={P.bsu.max_year} help={`10 % skattefradrag, inntil ${formatMoney(P.bsu.max_year)} spart`} />}
          {mode === 'feriepenger' && <div className="grid grid-cols-2 gap-3">
            <Toggle id="f5" label="Fem uker ferie (12 %)?" options={YN} value={five} onChange={setFive} />
            <Toggle id="o60" label="60 år eller eldre?" options={YN} value={o60} onChange={setO60} />
          </div>}
          {mode === 'overtid' && <div className="grid grid-cols-2 gap-3">
            <NumberField id="ot" label="Overtidstimer" value={otH} onChange={setOtH} unit="t" max={P.overtid.max_year} />
            <SelectField id="ts" label="Overtidstillegg" value={sup} onChange={setSup} options={SUP_OPTS} />
          </div>}
          {['kostnad', 'aga'].includes(mode) && <div className="grid grid-cols-2 gap-3">
            <SelectField id="z" label="Arbeidsgiveravgiftssone" value={zone} onChange={(v) => setZone(v as Zone)} options={ZONE_OPTS} />
            <SelectField id="otp" label="Innskuddspensjon (OTP)" value={otp} onChange={setOtp} options={OTP_OPTS} />
          </div>}
          {['kostnad', 'aga'].includes(mode) && <Toggle id="fp" label="Timelønnet: feriepenger i tillegg?" options={YN} value={fpTop} onChange={setFpTop} />}
          {mode === 'forskudd' && <div className="grid grid-cols-2 gap-3">
            <NumberField id="fr" label="Andre fradrag (renter m.m.)" value={ded} onChange={setDed} unit="kr" max={10000000} />
            <Toggle id="tz" label="Finnmark eller Nord-Troms?" options={YN} value={tz} onChange={setTz} />
          </div>}
          {mode === 'formue' && <Toggle id="gift" label="Gift og samlet skattlagt?" options={YN} value={married} onChange={setMarried} />}
          <p className="text-xs text-navy-500">Beregnet i nettleseren din · ingenting sendes · gratis</p>
        </form>
        <div className="lg:col-span-3" aria-live="polite">
          <div className="rounded-lg border border-accent-200 bg-white p-5">
            <div className="mb-4 text-center">
              <p className="text-sm font-medium text-navy-500">{head.l}</p>
              <p className="tabular-nums mt-1 text-4xl font-bold text-navy-900 sm:text-5xl">{head.v}</p>
              <p className="tabular-nums mt-1 text-sm text-navy-500">{head.s}</p>
            </div>
            {mode === 'feriepenger' ? (
              <table className="mt-2 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l="Feriepengegrunnlag" v={formatMoney(gross)} />
                <Row l={`Feriepenger ${formatPercent(fp.rate, 1)}`} v={formatMoney(fp.base)} />
                {fp.extra > 0 && <Row l="Tillegg 2,3 % for 60 år og over (inntil 6 G)" v={formatMoney(fp.extra)} />}
                <Row l="Feriepenger i alt" v={formatMoney(fp.total)} bold accent />
              </tbody></table>
            ) : mode === 'overtid' ? (
              <table className="mt-2 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l={`Timelønn (årslønn / ${formatNumber(P.overtid.hours_year)} timer)`} v={formatMoney(ot.hourly, 2)} />
                <Row l="Overtidssats per time" v={formatMoney(ot.overtimeRate, 2)} />
                <Row l={`Overtidsbetaling for ${otH} timer`} v={formatMoney(ot.pay)} />
                <Row l="Skatt på overtiden (marginalskatt)" v={`− ${formatMoney(ot.tax)}`} />
                <Row l="Igjen etter skatt" v={formatMoney(ot.net)} bold accent />
              </tbody></table>
            ) : ['kostnad', 'aga'].includes(mode) ? (
              <table className="mt-2 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l="Bruttolønn" v={formatMoney(ec.gross)} />
                {ec.feriepenger > 0 && <Row l="Feriepenger 10,2 %" v={formatMoney(ec.feriepenger)} />}
                <Row l={`Innskuddspensjon ${formatPercent(Number(otp), 0)} (inntil 12 G)`} v={formatMoney(ec.otp)} />
                <Row l={`Arbeidsgiveravgift ${formatPercent(ec.agaRate, 1)}`} v={formatMoney(ec.aga)} />
                <Row l="Kostnad per år" v={formatMoney(ec.total)} bold accent />
                <Row l="Kostnad per måned" v={formatMoney(ec.total / 12)} />
              </tbody></table>
            ) : mode === 'forskudd' ? (
              <table className="mt-2 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l="Overskudd (personinntekt)" v={formatMoney(se.profit)} />
                <Row l="Skatt på alminnelig inntekt" v={formatMoney(se.skattAlminnelig)} />
                <Row l={`Trygdeavgift ${formatPercent(P.trygdeavgift.business, 1)}`} v={formatMoney(se.trygdeavgift)} />
                <Row l="Trinnskatt" v={formatMoney(se.trinnskatt)} />
                <Row l="Forskuddsskatt i alt" v={formatMoney(se.total)} bold accent />
                <Row l="Per termin (fire terminer)" v={formatMoney(se.perTerm)} />
              </tbody></table>
            ) : mode === 'formue' ? (
              <table className="mt-2 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l="Nettoformue" v={formatMoney(gross)} />
                <Row l="Bunnfradrag" v={`− ${formatMoney(P.formue.bunnfradrag * (married === '1' ? 2 : 1))}`} />
                <Row l="Formue som skattlegges" v={formatMoney(fs.taxable)} />
                <Row l="Formuesskatt (1,0 %, 1,1 % over høy grense)" v={formatMoney(fs.tax)} bold accent />
              </tbody></table>
            ) : (<>
              <StackedBar ariaPrefix="Slik fordeles lønnen" total={A.gross} segments={[
                { label: 'Netto', value: A.net, color: '#15803d' },
                { label: 'Skatt alminnelig', value: A.skattAlminnelig - A.bsuCredit, color: '#334155' },
                { label: 'Trygdeavgift', value: A.trygdeavgift, color: '#94a3b8' },
                { label: 'Trinnskatt', value: A.trinnskatt, color: '#b45309' },
              ]} />
              <table className="mt-4 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l={`Brutto ${per}`} v={formatMoney(pp.gross)} />
                <Row l={`Minstefradrag i året (46 %, maks ${formatMoney(P.minstefradrag.max)})`} v={formatMoney(A.minstefradrag)} />
                {A.deductions > 0 && <Row l="Andre fradrag i året" v={formatMoney(A.deductions)} />}
                <Row l="Alminnelig inntekt i året" v={formatMoney(A.alminnelig)} />
                <Row l={`Skatt på alminnelig inntekt i året (${tiltak ? formatPercent(P.alminnelig.rate_tiltakssone, 1) : formatPercent(P.alminnelig.rate, 0)} over ${formatMoney(P.personfradrag)})`} v={formatMoney(A.skattAlminnelig)} />
                <Row l={`Trygdeavgift i året (${formatPercent(P.trygdeavgift.wage, 1)})`} v={formatMoney(A.trygdeavgift)} />
                <Row l="Trinnskatt i året" v={formatMoney(A.trinnskatt)} />
                {A.bsuCredit > 0 && <Row l="BSU-fradrag i året" v={`− ${formatMoney(A.bsuCredit)}`} />}
                <Row l="Skatt per år" v={formatMoney(A.totalTax)} />
                <Row l={`Lønn etter skatt ${per}`} v={formatMoney(pp.net)} bold accent />
                <Row l="Skattetrekk i en vanlig måned (10,5 måneder)" v={formatMoney(T.normalMonthTax)} />
                <Row l="Marginalskatt på neste krone" v={formatPercent(A.marginal)} />
              </tbody></table>
            </>)}
            <p className="mt-3 text-xs text-navy-500">Skatteetatens satser for 2026, skatteklasse 1, lønnsinntekt. Anslag: skattekortet og skatteoppgjøret ditt gjelder. Se metoden.</p>
            <div className="no-print mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={copy} className="rounded-lg border border-navy-300 bg-white px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50">{copied ? 'Kopiert' : 'Kopier resultatet'}</button>
              <button type="button" onClick={() => window.print()} className="rounded-lg border border-navy-300 bg-white px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50">Skriv ut</button>
              {methodHref && <a href={methodHref} className="ml-auto self-center text-sm text-accent-700 hover:underline">Slik er det beregnet</a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Row({ l, v, bold = false, accent = false }: { l: string; v: string; bold?: boolean; accent?: boolean }) { return <tr className={bold ? 'font-semibold' : ''}><td className={`py-2 pr-3 ${accent ? 'text-accent-700' : 'text-navy-600'}`}>{l}</td><td className={`tabular-nums whitespace-nowrap py-2 text-right ${accent ? 'text-accent-700' : 'text-navy-900'}`}>{v}</td></tr>; }
