import { useId } from 'react';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}

export default function InputField({ label, value, onChange, prefix = 'kr', suffix, min = 0, max, step = 1000, help }: Props) {
  const id = useId();

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 dark:text-gray-400 pointer-events-none font-medium">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className={`w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface py-3 text-lg font-medium tabular-nums text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${prefix ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-16' : 'pr-4'}`}
          aria-describedby={help ? `${id}-help` : undefined}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 dark:text-gray-400 pointer-events-none text-sm">
            {suffix}
          </span>
        )}
      </div>
      {help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">{help}</p>
      )}
    </div>
  );
}
