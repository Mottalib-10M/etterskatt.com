import { useState, useEffect, useMemo } from 'react';
import { calculateTakeHome } from '../../lib/tax-engine-no';
import { readUrlParams, writeUrlParams } from '../../lib/url-state';
import { formatCurrency, formatPercent } from '../../lib/format';
import InputField from '../ui/InputField';

const URL_CONFIG = {
  timelonn: 'number' as const,
  timer: 'number' as const,
  uker: 'number' as const,
};

export default function TimelonnsKalkulator() {
  const [timelonn, setTimelonn] = useState(300);
  const [timerPerUke, setTimerPerUke] = useState(37.5);
  const [ukerPerAar, setUkerPerAar] = useState(47);

  useEffect(() => {
    const params = readUrlParams(URL_CONFIG);
    if (params.timelonn) setTimelonn(params.timelonn);
    if (params.timer) setTimerPerUke(params.timer);
    if (params.uker) setUkerPerAar(params.uker);
  }, []);

  const brutto = useMemo(() => timelonn * timerPerUke * ukerPerAar, [timelonn, timerPerUke, ukerPerAar]);
  const result = useMemo(() => calculateTakeHome({ bruttoAarlig: brutto }), [brutto]);
  const nettoTimelonn = timerPerUke * ukerPerAar > 0 ? result.nettoAarlig / (timerPerUke * ukerPerAar) : 0;

  useEffect(() => {
    writeUrlParams({ timelonn, timer: timerPerUke, uker: ukerPerAar });
  }, [timelonn, timerPerUke, ukerPerAar]);

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dine opplysninger</h2>
          <InputField
            label="Timelønn (brutto)"
            value={timelonn}
            onChange={setTimelonn}
            prefix="kr"
            suffix="/time"
            step={10}
            help="Din timelønn før skatt"
          />
          <InputField
            label="Timer per uke"
            value={timerPerUke}
            onChange={setTimerPerUke}
            prefix=""
            suffix="timer"
            step={0.5}
            help="Standard i Norge: 37,5 timer"
          />
          <InputField
            label="Arbeidsuker per år"
            value={ukerPerAar}
            onChange={setUkerPerAar}
            prefix=""
            suffix="uker"
            step={1}
            help="52 uker minus ferie (standard: 47 uker)"
          />
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        {/* Resultat */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-brand-500 px-6 py-8 text-center">
            <p className="text-sm font-medium text-brand-100 uppercase tracking-wider">Netto timelønn</p>
            <p className="mt-2 text-4xl sm:text-5xl font-bold text-white tabular-nums">
              {formatCurrency(nettoTimelonn)}<span className="text-xl text-brand-200">/time</span>
            </p>
            <p className="mt-1 text-brand-200 text-sm">
              Brutto årslønn: {formatCurrency(brutto)} &middot; Netto årslønn: {formatCurrency(result.nettoAarlig)}
            </p>
          </div>
        </div>

        {/* Sammenligning */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
          <div className="bg-brand-500 px-5 py-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Oversikt</h3>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Brutto timelønn</span>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formatCurrency(timelonn)}/time</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Timer per år</span>
              <span className="font-medium text-gray-900 dark:text-white tabular-nums">{(timerPerUke * ukerPerAar).toFixed(0)} timer</span>
            </div>
            <hr className="border-gray-100 dark:border-gray-700" />
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-900 dark:text-white">Brutto årslønn</span>
              <span className="tabular-nums">{formatCurrency(brutto)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total skatt</span>
              <span className="tabular-nums text-red-600 dark:text-red-400">{formatCurrency(-result.totalSkatt)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-brand-600 dark:text-brand-400">
              <span>Netto årslønn</span>
              <span className="tabular-nums">{formatCurrency(result.nettoAarlig)}</span>
            </div>
            <hr className="border-gray-100 dark:border-gray-700" />
            <div className="flex justify-between text-sm font-semibold text-green-600 dark:text-green-400">
              <span>Netto timelønn</span>
              <span className="tabular-nums">{formatCurrency(nettoTimelonn)}/time</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Netto månedslønn</span>
              <span className="tabular-nums">{formatCurrency(result.nettoMaanedlig)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Effektiv skattesats</span>
              <span className="tabular-nums">{formatPercent(result.effektivSkattesats)}</span>
            </div>
          </div>
        </div>

        {/* Forklaring */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Om beregningen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Denne kalkulatoren konverterer din brutto timelønn til årslønn og beregner hva du sitter igjen med etter norsk skatt for 2025. Standard arbeidstid i Norge er 37,5 timer per uke. Med 5 ukers ferie (25 virkedager) har du ca. 47 arbeidsuker. Kalkulatoren inkluderer trinnskatt, trygdeavgift (7,9%), fellesskatt (22%), minstefradrag og personfradrag. Resultatet viser din reelle netto timelønn — det du faktisk tjener per time etter at alle skatter er trukket.
          </p>
        </div>
      </div>
    </div>
  );
}
