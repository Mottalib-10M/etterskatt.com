/** Exemples chiffrés : toujours produits par le moteur (RECETTE §4). */
import { compute, type Period } from './engine/no';
import P from '../data/params-2026.json';
export { P };
export const ex = (gross: number, o: { period?: Period; tiltakssone?: boolean } = {}) => compute({ gross, period: o.period ?? 'annual', tiltakssone: o.tiltakssone ?? false });
