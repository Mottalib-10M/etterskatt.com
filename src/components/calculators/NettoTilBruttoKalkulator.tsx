import { useState, useEffect, useMemo } from 'react';
import { calculateRequiredGross, calculateTakeHome } from '../../lib/tax-engine-no';
import { readUrlParams, writeUrlParams } from '../../lib/url-state';
import { formatCurrency, formatPercent } from '../../lib/format';
import InputField from '../ui/InputField';

const URL_CONFIG = { netto: 'number' as const };

export default function NettoTilBruttoKalkulator() {
  const [targetNetto, setTargetNetto] = useState(400000);

  useEffect(() => {
    const params = readUrlParams(URL_CONFIG);
    if (params.netto) setTargetNetto(params.netto);
  }, []);

  const requiredGross = useMemo(() => calculateRequiredGross(targetNetto), [targetNetto]);
  const result = useMemo(() => calculateTakeHome({ bruttoAarlig: requiredGross }), [requiredGross]);

  useEffect(() => {
    writeUrlParams({ netto: targetNetto });
  }, [targetNetto]);

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ønsket nettolønn</h2>
          <InputField
            label="Ønsket nettolønn per år"
            value={targetNetto}
            onChange={setTargetNetto}
            prefix="kr"
            suffix="/år"
            help="Hva vil du sitte igjen med etter skatt?"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-accent-500 px-6 py-6 text-center">
            <p className="text-sm font-medium text-accent-100 uppercase tracking-wider">Du trenger en bruttolønn på</p>
            <p className="mt-2 text-4xl font-bold text-white tabular-nums">{formatCurrency(requiredGross)}</p>
            <p className="mt-1 text-accent-200 text-sm">
              per år &middot; {formatCurrency(requiredGross / 12)}/mnd
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        {/* Skattefordeling */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-brand-500 px-5 py-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Skattefordeling</h3>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-900 dark:text-white">Nødvendig bruttolønn</span>
              <span className="tabular-nums">{formatCurrency(requiredGross)}</span>
            </div>
            <hr className="border-gray-100 dark:border-gray-700" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Trinnskatt</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">{formatCurrency(-result.trinnskatt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Trygdeavgift</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">{formatCurrency(-result.trygdeavgift)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Fellesskatt</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">{formatCurrency(-result.fellesskatt)}</span>
            </div>
            <hr className="border-gray-100 dark:border-gray-700" />
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-900 dark:text-white">Total skatt</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">{formatCurrency(-result.totalSkatt)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-brand-600 dark:text-brand-400">
              <span>Nettolønn</span>
              <span className="tabular-nums">{formatCurrency(result.nettoAarlig)}</span>
            </div>
            <hr className="border-gray-100 dark:border-gray-700" />
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Effektiv skattesats</span>
              <span className="tabular-nums">{formatPercent(result.effektivSkattesats)}</span>
            </div>
          </div>
        </div>

        {/* Forklaring */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Slik fungerer netto-til-brutto</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Denne kalkulatoren regner baklengs fra ønsket nettolønn for å finne ut hvilken bruttolønn du trenger. Den tar hensyn til alle norske skattekomponenter for 2025: trinnskatt, trygdeavgift (7,9%), fellesskatt (22%), minstefradrag (46%, maks 114 950 kr) og personfradrag (70 000 kr). Beregningen bruker en iterativ metode for å finne det eksakte bruttobeløpet som gir deg ønsket nettolønn etter alle skattetrekk. Dette er nyttig når du skal forhandle lønn eller sammenligne jobbtilbud, slik at du vet nøyaktig hva du trenger i brutto for å sitte igjen med det du ønsker.
          </p>
        </div>
      </div>
    </div>
  );
}
