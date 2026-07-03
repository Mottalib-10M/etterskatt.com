import { useState, useEffect, useMemo } from 'react';
import { calculateTakeHome, type TaxInput } from '../../lib/tax-engine-no';
import { KOMMUNE_RATES, ALL_KOMMUNER } from '../../data/tax-2026';
import { readUrlParams, writeUrlParams } from '../../lib/url-state';
import { formatCurrency, formatPercent } from '../../lib/format';
import InputField from '../ui/InputField';
import ResultPanel from '../ui/ResultPanel';
import BreakdownBar from '../ui/BreakdownBar';

const URL_CONFIG = {
  brutto: 'number' as const,
  kommune: 'string' as const,
};

interface Props {
  defaultGross?: number;
}

export default function LonnsKalkulator({ defaultGross = 550000 }: Props) {
  const [brutto, setBrutto] = useState(defaultGross);
  const [kommune, setKommune] = useState('oslo');

  useEffect(() => {
    const params = readUrlParams(URL_CONFIG);
    if (params.brutto) setBrutto(params.brutto);
    if (params.kommune && KOMMUNE_RATES[params.kommune]) setKommune(params.kommune);
  }, []);

  const result = useMemo(() => calculateTakeHome({
    bruttoAarlig: brutto,
    kommuneRate: KOMMUNE_RATES[kommune]?.rate,
  }), [brutto, kommune]);

  useEffect(() => {
    writeUrlParams({ brutto, kommune });
  }, [brutto, kommune]);

  const barSegments = [
    { label: 'Trinnskatt', value: result.trinnskatt, color: '#BA0C2F' },
    { label: 'Trygdeavgift', value: result.trygdeavgift, color: '#7c3aed' },
    { label: 'Fellesskatt', value: result.fellesskatt, color: '#00205B' },
    { label: 'Nettolønn', value: result.nettoAarlig, color: '#16a34a' },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Inndata */}
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dine opplysninger</h2>

          <InputField
            label="Årlig bruttolønn"
            value={brutto}
            onChange={setBrutto}
            prefix="kr"
            suffix="/år"
            help="Skriv inn din årlige bruttolønn før skatt"
          />

          {/* Kommune */}
          <div className="mb-4">
            <label htmlFor="kommune" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kommune
            </label>
            <select
              id="kommune"
              value={kommune}
              onChange={(e) => setKommune(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {ALL_KOMMUNER.map((code) => (
                <option key={code} value={code}>
                  {KOMMUNE_RATES[code].name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resultater */}
      <div className="lg:col-span-3 space-y-6">
        <ResultPanel result={result} />

        {/* Lønnsfordeling */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
            Lønnsfordeling
          </h3>
          <BreakdownBar segments={barSegments} total={brutto} />
        </div>

        {/* Trinnskatt-tabell */}
        {result.trinnskattBands.length > 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
            <div className="bg-brand-500 px-5 py-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Trinnskatt-trinn</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-2.5 text-left text-gray-500 dark:text-gray-400 font-medium">Trinn</th>
                  <th className="px-5 py-2.5 text-right text-gray-500 dark:text-gray-400 font-medium">Sats</th>
                  <th className="px-5 py-2.5 text-right text-gray-500 dark:text-gray-400 font-medium">Grunnlag</th>
                  <th className="px-5 py-2.5 text-right text-gray-500 dark:text-gray-400 font-medium">Skatt</th>
                </tr>
              </thead>
              <tbody>
                {result.trinnskattBands.map((band, i) => (
                  <tr key={i} className={`border-b border-gray-50 dark:border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-800/30'}`}>
                    <td className="px-5 py-2 text-gray-700 dark:text-gray-300">{band.name}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">{formatPercent(band.rate)}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">{formatCurrency(band.taxableAmount)}</td>
                    <td className="px-5 py-2 text-right tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(band.tax)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                  <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white" colSpan={3}>Total trinnskatt</td>
                  <td className="px-5 py-3 text-right tabular-nums font-bold text-brand-600 dark:text-brand-400">{formatCurrency(result.trinnskatt)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Periodeoversikt */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-brand-500 px-5 py-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Periodeoversikt</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-2.5 text-left text-gray-500 dark:text-gray-400 font-medium">Periode</th>
                <th className="px-5 py-2.5 text-right text-gray-500 dark:text-gray-400 font-medium">Brutto</th>
                <th className="px-5 py-2.5 text-right text-gray-500 dark:text-gray-400 font-medium">Netto</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Årlig', gross: brutto, net: result.nettoAarlig },
                { label: 'Månedlig', gross: brutto / 12, net: result.nettoMaanedlig },
                { label: 'Annenhver uke', gross: brutto / 26, net: result.nettoAnnenhverUke },
                { label: 'Ukentlig', gross: brutto / 52, net: result.nettoUkentlig },
              ].map((row, i) => (
                <tr key={i} className={`border-b border-gray-50 dark:border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-800/30'}`}>
                  <td className="px-5 py-2 text-gray-700 dark:text-gray-300">{row.label}</td>
                  <td className="px-5 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">{formatCurrency(row.gross)}</td>
                  <td className="px-5 py-2 text-right tabular-nums font-medium text-green-600 dark:text-green-400">{formatCurrency(row.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
