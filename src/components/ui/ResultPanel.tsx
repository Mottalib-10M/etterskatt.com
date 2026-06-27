import { formatCurrency, formatPercent } from '../../lib/format';
import type { TaxResult } from '../../lib/tax-engine-no';

interface Props {
  result: TaxResult;
}

export default function ResultPanel({ result }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface overflow-hidden">
      {/* Main net amount */}
      <div className="bg-brand-500 px-6 py-8 text-center">
        <p className="text-sm font-medium text-brand-100 uppercase tracking-wider">Din lønn etter skatt</p>
        <p className="mt-2 text-4xl sm:text-5xl font-bold text-white tabular-nums result-value">
          {formatCurrency(result.nettoAarlig)}
        </p>
        <p className="mt-1 text-brand-200 text-sm">
          per år &middot; {formatCurrency(result.nettoMaanedlig)}/mnd &middot; {formatCurrency(result.nettoAnnenhverUke)}/2 uker
        </p>
      </div>

      {/* Breakdown */}
      <div className="px-6 py-5 space-y-3">
        <Row label="Bruttolønn" value={result.bruttoAarlig} bold />
        <Divider />
        <Row label="Minstefradrag" value={result.minstefradrag} note="Fradrag" />
        <Row label="Personfradrag" value={result.personfradrag} note="Fradrag" />
        <Row label="Alminnelig inntekt" value={result.alminneligInntekt} />
        <Divider />
        <Row label="Trinnskatt" value={-result.trinnskatt} negative />
        <Row label="Trygdeavgift (7,9%)" value={-result.trygdeavgift} negative />
        <Row label="Fellesskatt (22%)" value={-result.fellesskatt} negative />
        <Divider />
        <Row label="Total skatt" value={-result.totalSkatt} negative bold />
        <Row label="Nettolønn" value={result.nettoAarlig} bold accent />
        <Divider />
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Effektiv skattesats</span>
          <span className="tabular-nums font-medium">{formatPercent(result.effektivSkattesats)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Marginalsats</span>
          <span className="tabular-nums font-medium">{formatPercent(result.marginalsats)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, negative, accent, note }: {
  label: string; value: number; bold?: boolean; negative?: boolean; accent?: boolean; note?: string;
}) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-semibold' : ''} ${accent ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
      <span className="text-sm">{label}</span>
      <div className="text-right">
        <span className={`tabular-nums ${negative ? 'text-red-600 dark:text-red-400' : ''}`}>
          {formatCurrency(value)}
        </span>
        {note && <span className="block text-xs text-green-600 dark:text-green-400">{note}</span>}
      </div>
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-100 dark:border-gray-700" />;
}
