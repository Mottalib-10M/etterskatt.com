/**
 * URL state management — encode/decode calculator parameters in the URL hash
 */

export interface UrlConfig {
  [key: string]: 'number' | 'string';
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function readUrlParams(config: UrlConfig): Record<string, any> {
  if (typeof window === 'undefined') return {};

  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const result: Record<string, any> = {};

  for (const [key, type] of Object.entries(config)) {
    const value = params.get(key);
    if (value !== null) {
      result[key] = type === 'number' ? parseFloat(value) : value;
    }
  }

  return result;
}

export function writeUrlParams(values: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }
    const hash = params.toString();
    if (hash) {
      window.history.replaceState(null, '', `#${hash}`);
    }
  }, 300);
}
