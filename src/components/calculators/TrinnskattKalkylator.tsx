import { useState, useEffect, useMemo } from 'react';
import { calculateTrinnskatt } from '../../lib/tax-engine-no';
import { TRINNSKATT_BRACKETS } from '../../data/tax-2026';
import { readUrlParams, writeUrlParams } from '../../lib/url-state';
import { formatCurrency, formatPercent } from '../../lib/format';
import InputField from '../ui/InputField';

const URL_CONFIG = { brutto: 'number' as const };

export default function TrinnskattKalkylator() {
  const [brutto, setBrutto] = useState(600000);

  useEffect(() => {
    const params = readUrlParams(URL_CONFIG);
    if (params.brutto) setBrutto(params.brutto);
  }, []);

  const { total, bands } = useMemo(() => calculateTrinnskatt(brutto), [brutto]);

  useEffect(() => {
    writeUrlParams({ brutto });
  }, [brutto]);

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Beregn trinnskatt</h2>
          <InputField
            label="Årlig personinntekt"
            value={brutto}
            onChange={setBrutto}
            prefix="kr"
            suffix="/år"
            help="Personinntekt (lønn, pensjon, næringsinntekt)"
          />
        </div>

        {/* Resultat */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-brand-500 px-6 py-6 text-center">
            <p className="text-sm font-medium text-brand-100 uppercase tracking-wider">Total trinnskatt</p>
            <p className="mt-2 text-4xl font-bold text-white tabular-nums">{formatCurrency(total)}</p>
            <p className="mt-1 text-brand-200 text-sm">
              {brutto > 0 ? `${(total / brutto * 100).toFixed(1)}% av personinntekt` : '0,0% av personinntekt'}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        {/* Trinn-tabell */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-brand-500 px-5 py-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Trinnskatt 2025 — Trinnvis oversikt</h3>
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
              {TRINNSKATT_BRACKETS.filter(b => b.rate > 0).map((bracket, i) => {
                const band = bands.find(b => b.rate === bracket.rate * 100);
                return (
                  <tr key={i} className={`border-b border-gray-50 dark:border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-800/30'}`}>
                    <td className="px-5 py-2 text-gray-700 dark:text-gray-300">
                      Trinn {i + 1}
                      <span className="block text-xs text-gray-400">
                        {new Intl.NumberFormat('nb-NO').format(bracket.min)} – {bracket.max === Infinity ? '∞' : new Intl.NumberFormat('nb-NO').format(bracket.max)} kr
                      </span>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">{formatPercent(bracket.rate * 100)}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">{formatCurrency(band?.taxableAmount ?? 0)}</td>
                    <td className="px-5 py-2 text-right tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(band?.tax ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white" colSpan={3}>Total trinnskatt</td>
                <td className="px-5 py-3 text-right tabular-nums font-bold text-brand-600 dark:text-brand-400">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Forklaring */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hva er trinnskatt?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Trinnskatt er en progressiv skatt på personinntekt som erstattet toppskatt fra 2016. Den beregnes trinnvis slik at du bare betaler den høyere satsen på inntekt over grensen for hvert trinn. For eksempel, hvis du tjener 600 000 kr, betaler du 1,7% kun på inntekten mellom 217 400 og 306 050 kr, deretter 4,0% på inntekten mellom 306 050 og 600 000 kr. Trinnskatten beregnes på personinntekt (brutto lønn) uten fradrag. Satsene fastsettes av Stortinget hvert år gjennom statsbudsjettet.
          </p>
        </div>
      </div>
    </div>
  );
}
