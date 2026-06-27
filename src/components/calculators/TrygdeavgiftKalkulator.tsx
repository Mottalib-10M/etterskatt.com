import { useState, useEffect, useMemo } from 'react';
import { calculateTrygdeavgift } from '../../lib/tax-engine-no';
import { TRYGDEAVGIFT } from '../../data/tax-2025';
import { readUrlParams, writeUrlParams } from '../../lib/url-state';
import { formatCurrency, formatPercent } from '../../lib/format';
import InputField from '../ui/InputField';

const URL_CONFIG = { brutto: 'number' as const };

export default function TrygdeavgiftKalkulator() {
  const [brutto, setBrutto] = useState(550000);

  useEffect(() => {
    const params = readUrlParams(URL_CONFIG);
    if (params.brutto) setBrutto(params.brutto);
  }, []);

  const trygdeavgift = useMemo(() => calculateTrygdeavgift(brutto), [brutto]);
  const effectiveRate = brutto > 0 ? (trygdeavgift / brutto) * 100 : 0;

  useEffect(() => {
    writeUrlParams({ brutto });
  }, [brutto]);

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Beregn trygdeavgift</h2>
          <InputField
            label="Årlig personinntekt"
            value={brutto}
            onChange={setBrutto}
            prefix="kr"
            suffix="/år"
            help="Lønnsinntekt som trygdeavgiften beregnes på"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-brand-500 px-6 py-6 text-center">
            <p className="text-sm font-medium text-brand-100 uppercase tracking-wider">Din trygdeavgift</p>
            <p className="mt-2 text-4xl font-bold text-white tabular-nums">{formatCurrency(trygdeavgift)}</p>
            <p className="mt-1 text-brand-200 text-sm">
              {formatPercent(effectiveRate)} effektiv sats &middot; {formatCurrency(trygdeavgift / 12)}/mnd
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        {/* Detaljer */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-brand-500 px-5 py-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Beregningsdetaljer</h3>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Personinntekt</span>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formatCurrency(brutto)}</span>
            </div>
            <hr className="border-gray-100 dark:border-gray-700" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Sats for lønnsinntekt</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatPercent(TRYGDEAVGIFT.rate * 100)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Fribeløp</span>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formatCurrency(TRYGDEAVGIFT.threshold)}</span>
            </div>
            <hr className="border-gray-100 dark:border-gray-700" />
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-900 dark:text-white">Trygdeavgift</span>
              <span className="text-brand-600 dark:text-brand-400 tabular-nums">{formatCurrency(trygdeavgift)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Per måned</span>
              <span className="text-gray-600 dark:text-gray-300 tabular-nums">{formatCurrency(trygdeavgift / 12)}</span>
            </div>
          </div>
        </div>

        {/* Forklaring */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hva er trygdeavgift?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            Trygdeavgift er en avgift som alle som bor og arbeider i Norge betaler til folketrygden (NAV). Avgiften finansierer blant annet sykepenger, foreldrepenger, dagpenger, alderspensjon og uføretrygd. For lønnsmottakere er satsen 7,9% i 2025. Avgiften beregnes på brutto personinntekt, men det er et fribeløp på {formatCurrency(TRYGDEAVGIFT.threshold)} — inntekt under dette er fritatt.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Merk at arbeidsgivere også betaler arbeidsgiveravgift (14,1% i sone 1) i tillegg til trygdeavgiften du ser her. Det finnes også en innfasingsregel: trygdeavgiften kan ikke utgjøre mer enn 25,8% av den delen av personinntekten som overstiger fribeløpet. Denne regelen sikrer at personer med lav inntekt ikke betaler uforholdsmessig mye i trygdeavgift.
          </p>
        </div>
      </div>
    </div>
  );
}
