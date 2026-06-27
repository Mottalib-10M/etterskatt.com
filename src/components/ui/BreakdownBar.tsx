import { formatPercent } from '../../lib/format';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  total: number;
}

export default function BreakdownBar({ segments, total }: Props) {
  if (total <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={i}
              className="bar-segment relative group"
              style={{ '--bar-width': `${pct}%`, backgroundColor: seg.color } as any}
              title={`${seg.label}: ${formatPercent(pct)}`}
              role="img"
              aria-label={`${seg.label}: ${formatPercent(pct)}`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {pct > 8 ? `${pct.toFixed(1)}%` : ''}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: seg.color }} />
            {seg.label}
          </div>
        ))}
      </div>
    </div>
  );
}
