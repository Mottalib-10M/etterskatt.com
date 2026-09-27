/**
 * Calibrage des extraits au build (RECETTE §15 point 15, journal 2026-09-20) : la page choisit,
 * parmi des fins de phrase, la première qui fait tomber le titre dans 50–60 caractères et la
 * description dans 150–160. Si aucune ne convient, le build échoue.
 */
const DESC_TAILS = ['', ' Gratis.', ' Gratis, uten innlogging.', ' Gratis og privat.', ' Oppdatert for 2026.', ' Gratis, oppdatert for 2026.', ' Beregnet i nettleseren, gratis.'];
const TITLE_TAILS = ['', ' 2026', ' | Norge'];
function fit(core: string, tails: string[], lo: number, hi: number, what: string): string {
  for (const t of tails) { const s = core + t; if (s.length >= lo && s.length <= hi) return s; }
  throw new Error(`${what} hors fenêtre ${lo}–${hi} (${core.length}) : « ${core} »`);
}
export const fitDescription = (d: string) => fit(d.trim(), DESC_TAILS, 150, 160, 'Description');
export const fitTitle = (t: string) => fit(t.trim(), TITLE_TAILS, 50, 60, 'Titre');
