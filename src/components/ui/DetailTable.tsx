import { formatCurrency, formatPercent } from '../../lib/format';

interface Row {
  label: string;
  amount: number;
  rate?: number;
}

interface Props {
  title: string;
  rows: Row[];
  total?: { label: string; amount: number };
}

export default function DetailTable({ title, rows, total }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-brand-500 text-white">
            <th className="px-4 py-3 text-left font-semibold">{title}</th>
            {rows.some(r => r.rate !== undefined) && (
              <th className="px-4 py-3 text-right font-semibold">Sats</th>
            )}
            <th className="px-4 py-3 text-right font-semibold">Beløp</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-t border-gray-100 dark:border-gray-700 ${i % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
              <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{row.label}</td>
              {rows.some(r => r.rate !== undefined) && (
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-500 dark:text-gray-400">
                  {row.rate !== undefined ? formatPercent(row.rate) : '—'}
                </td>
              )}
              <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900 dark:text-white">
                {formatCurrency(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        {total && (
          <tfoot>
            <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{total.label}</td>
              {rows.some(r => r.rate !== undefined) && <td />}
              <td className="px-4 py-3 text-right tabular-nums font-bold text-brand-600 dark:text-brand-400">
                {formatCurrency(total.amount)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
