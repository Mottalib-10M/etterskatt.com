/** Plasserer en årslønn mot SSBs gjennomsnittlige månedslønn for heltidsekvivalenter (november 2025). */
import P from '../data/params-2026.json';
import { formatMoney, formatPercent } from './format';
const S = P.ssb;
export const SNITT_AAR = S.avg_month_nov2025 * 12;
export function position(annual: number): string {
  const x = annual / SNITT_AAR - 1;
  const rel = Math.abs(x) < 0.005 ? 'omtrent det samme som' : `${formatPercent(Math.abs(x), 0)} ${x > 0 ? 'mer enn' : 'mindre enn'}`;
  return `Til sammenligning var gjennomsnittlig månedslønn for heltidsekvivalenter ${formatMoney(S.avg_month_nov2025)} i november 2025 ifølge SSB, eller ${formatMoney(SNITT_AAR)} i året. En årslønn på ${formatMoney(Math.round(annual))} er dermed ${rel} gjennomsnittet. Snittet trekkes opp av de høyeste lønningene, så medianen, lønnen i midten, ligger lavere.`;
}
