/**
 * Number formatting utilities for Norwegian locale
 */

const nokFormatter = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const nokDetailFormatter = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('nb-NO', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('nb-NO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number, detailed = false): string {
  return detailed ? nokDetailFormatter.format(value) : nokFormatter.format(value);
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatKr(value: number): string {
  return numberFormatter.format(value) + ' kr';
}

export function parseNumber(input: string): number {
  const cleaned = input.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}
