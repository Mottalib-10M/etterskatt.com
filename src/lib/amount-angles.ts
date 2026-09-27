/**
 * Un angle par montant (RECETTE §6.2) : le seuil réel propre à chaque revenu, son H2, son
 * paragraphe et ses questions. Les montants viennent du moteur, jamais écrits à la main.
 */
import { compute, feriepenger, employerCost, overtime, hourlyToAnnual } from './engine/no';
import P from '../data/params-2026.json';
import { formatMoney as $, formatPercent as pct } from './format';

export interface Angle { title: string; description: string; h1: string; h2: string; p: string; h2b: string; p2: string; faqs: Array<{ q: string; a: string }> }
const c = (g: number, o: Partial<Parameters<typeof compute>[0]> = {}) => compute({ gross: g, ...o });
const T = P.trinnskatt;
const G = P.grunnbelop.from_2026_05_01;
const avgYear = P.ssb.avg_month_nov2025 * 12;

export function annualAngle(g: number): Angle {
  const r = c(g); const a = r.annual; const t = r.tabell;
  const h1 = `Lønn etter skatt på ${$(g)} i 2026`;
  const A: Record<number, () => Angle> = {
    300000: () => ({ h1,
      title: `300 000 kr etter skatt 2026: nettolønn og trinnskatt trinn 1`, description: `Med 300 000 kr i årslønn får du ${$(a.net)} etter skatt i 2026, ${$(a.net / 12)} i måneden i snitt. Bare trinn 1 i trinnskatten gjelder, med 1,7 %.`,
      h2: 'Bare første trinn i trinnskatten',
      p: `En årslønn på ${$(300000)} ligger mellom innslagspunktet for trinn 1, ${$(T[0].from)}, og trinn 2, ${$(T[1].from)}. Trinnskatten blir derfor bare ${$(a.trinnskatt)}, 1,7 % av det som ligger over ${$(T[0].from)}. De store postene er trygdeavgiften på 7,6 %, ${$(a.trygdeavgift)}, og skatten på alminnelig inntekt, ${$(a.skattAlminnelig)}: 22 % av lønnen etter minstefradraget på ${$(a.minstefradrag)} og personfradraget på ${$(P.personfradrag)}. Samlet skatt er ${$(a.totalTax)}, eller ${pct(a.effective)} av lønnen, og du sitter igjen med ${$(a.net)} i året. Med tabelltrekk trekkes omtrent ${$(t.normalMonthTax)} i en vanlig måned, slik at utbetalingen blir ${$(t.normalMonthNet)}. Nivået er typisk for deltid eller for et første år i arbeid med lav timelønn. Hver ekstra krone opp til ${$(T[1].from)} beskattes med ${pct(a.marginal)}.`,
      h2b: 'Når neste trinn slår inn',
      p2: `Går lønnen over ${$(T[1].from)}, stiger satsen i trinnskatten fra 1,7 % til 4,0 % på den delen som ligger over. Marginalskatten øker da fra ${pct(a.marginal)} til ${pct(c(400000).annual.marginal)}.`,
      faqs: [
        { q: 'Hvor mye får jeg utbetalt av 300 000 kr i året?', a: `Omtrent ${$(a.net)} i året etter skatt, eller ${$(a.net / 12)} i måneden i snitt. I en vanlig måned med tabelltrekk får du rundt ${$(t.normalMonthNet)}, mens juni og desember gir mer fordi det trekkes ingen skatt i juni og halv skatt i desember.` },
        { q: 'Hvor mye trinnskatt betaler jeg på 300 000 kr?', a: `${$(a.trinnskatt)} for 2026. Trinnskatten er 1,7 % av inntekten mellom ${$(T[0].from)} og ${$(T[1].from)}, og 300 000 kr ligger ${$(300000 - T[0].from)} over det første innslagspunktet. Den beregnes av bruttolønnen, uten fradrag. Lønn under det første innslagspunktet gir ingen trinnskatt.` },
        { q: 'Er 300 000 kr nok til å få frikort?', a: `Nei. Frikortgrensen er ${$(P.frikort_limit)} for 2026, og med 300 000 kr i lønn får du et vanlig skattekort med tabelltrekk eller prosenttrekk. Frikort passer for studenter og andre som tjener lite ved siden av, og gir ingen skattetrekk før grensen er nådd.` },
      ] }),
    350000: () => ({ h1,
      title: `350 000 kr etter skatt 2026: forbi trinn 2 i trinnskatten`, description: `350 000 kr i årslønn gir ${$(a.net)} etter skatt i 2026. Lønnen ligger over innslagspunktet for trinn 2, så hver ny krone beskattes med ${pct(a.marginal)}.`,
      h2: 'Lønnen har passert trinn 2',
      p: `Med ${$(350000)} i året har lønnen passert innslagspunktet for trinn 2 i trinnskatten, ${$(T[1].from)}. Den delen som ligger over, ${$(350000 - T[1].from)}, beskattes med 4,0 % i trinnskatt i stedet for 1,7 %. Samlet trinnskatt blir ${$(a.trinnskatt)}, trygdeavgiften ${$(a.trygdeavgift)} og skatten på alminnelig inntekt ${$(a.skattAlminnelig)}. Til sammen betaler du ${$(a.totalTax)} i skatt, ${pct(a.effective)} av lønnen, og får ${$(a.net)} utbetalt i løpet av året. Marginalskatten er nå ${pct(a.marginal)}: av en lønnsøkning på ${$(10000)} beholder du omtrent ${$(10000 * (1 - a.marginal))}. Den satsen gjelder helt opp til ${$(T[2].from)}, der trinn 3 starter. For de fleste i fulltidsjobb med lavere lønn er dette den marginalskatten som gjelder for overtid og tillegg.`,
      h2b: 'Per måned',
      p2: `Delt på tolv måneder blir nettolønnen ${$(a.net / 12)}. Med tabelltrekk får du ${$(t.normalMonthNet)} i en vanlig måned, fordi skatten fordeles over 10,5 måneder.`,
      faqs: [
        { q: 'Hvor mye er 350 000 kr etter skatt per måned?', a: `Rundt ${$(a.net / 12)} i gjennomsnitt, og ${$(t.normalMonthNet)} i en vanlig måned med tabelltrekk. Differansen kommer av at det ikke trekkes skatt i juni og bare halv skatt i desember, slik at de ti andre månedene får et litt høyere trekk.` },
        { q: 'Hva er marginalskatten på 350 000 kr?', a: `${pct(a.marginal)} i 2026: 22 % skatt på alminnelig inntekt, 7,6 % trygdeavgift og 4,0 % trinnskatt. Den gjelder for hver krone du tjener ekstra, for eksempel overtid, bonus eller en lønnsøkning, så lenge inntekten holder seg under ${$(T[2].from)}.` },
        { q: 'Hvor mye skatt betaler jeg totalt på 350 000 kr?', a: `${$(a.totalTax)} for inntektsåret 2026, som er ${pct(a.effective)} av bruttolønnen. Beløpet forutsetter skatteklasse 1, lønn som eneste inntekt og ingen andre fradrag enn minstefradrag og personfradrag. Renter og fagforeningskontingent gir lavere skatt. Beløpet er et anslag for hele året.` },
      ] }),
    400000: () => ({ h1,
      title: `400 000 kr etter skatt 2026: tabelltrekk måned for måned`, description: `400 000 kr i året gir ${$(a.net)} etter skatt i 2026. Slik ser utbetalingen ut i en vanlig måned, i juni uten skattetrekk og i desember med halv skatt.`,
      h2: 'Utbetalingen gjennom året',
      p: `På ${$(400000)} i årslønn er bruttolønnen ${$(400000 / 12)} i måneden, og samlet skatt for året ${$(a.totalTax)}. Men arbeidsgiveren trekker ikke en tolvtedel hver måned. Med tabellkort fordeles skatten over 10,5 måneder: fullt trekk i ti måneder, ingen skatt i juni og halv skatt i desember. I en vanlig måned trekkes derfor rundt ${$(t.normalMonthTax)}, og du får ${$(t.normalMonthNet)} utbetalt. I desember er trekket omtrent ${$(t.decemberTax)}. Juni er spesiell fordi feriepengene utbetales da, og for de fleste erstatter de lønnen for ferien. Resultatet over året er det samme: ${$(a.net)} etter skatt, eller ${$(a.net / 12)} i snitt per måned. Trekket i hver måned er et forskudd, og skatteoppgjøret våren etter viser om du har betalt for mye eller for lite.`,
      h2b: 'Prosentkort i stedet for tabellkort',
      p2: `Med prosentkort trekkes samme prosentsats av hver utbetaling, omtrent ${pct(a.effective)} på denne lønnen. Det gir jevnere trekk, men ingen skattefri juni og halv skatt i desember.`,
      faqs: [
        { q: 'Hvor mye får jeg utbetalt på 400 000 kr i måneden?', a: `Omtrent ${$(t.normalMonthNet)} i en vanlig måned med tabelltrekk, av en bruttolønn på ${$(400000 / 12)}. Det gjennomsnittlige nettobeløpet over tolv måneder er ${$(a.net / 12)}, fordi desember gir halv skatt og juni er uten skattetrekk. Samlet skatt for året er ${$(a.totalTax)}.` },
        { q: 'Hvor mye skatt trekkes i desember på 400 000 kr?', a: `Rundt ${$(t.decemberTax)}, halvparten av det vanlige månedstrekket. Halv skatt i desember er innebygd i tabelltrekket og betyr ikke at du betaler mindre skatt for året: det du slipper i desember, er fordelt på de andre månedene. Trekket gjelder tabellkort, ikke prosentkort.` },
        { q: 'Hva er gjennomsnittsskatten på 400 000 kr?', a: `${pct(a.effective)}. Av ${$(400000)} betaler du ${$(a.totalTax)} i skatt for 2026: ${$(a.skattAlminnelig)} på alminnelig inntekt, ${$(a.trygdeavgift)} i trygdeavgift og ${$(a.trinnskatt)} i trinnskatt. Marginalskatten, satsen på neste krone, er høyere: ${pct(a.marginal)}.` },
      ] }),
    450000: () => ({ h1,
      title: `450 000 kr etter skatt 2026: BSU og fradrag for unge`, description: `450 000 kr i årslønn gir ${$(a.net)} etter skatt. Er du under 34 år, kan BSU-sparing gi inntil ${$(P.bsu.max_year * P.bsu.rate)} lavere skatt i 2026.`,
      h2: 'BSU gir fradrag i skatten',
      p: `${$(450000)} i året er en vanlig lønn for unge i fast jobb, og mange i den situasjonen har en BSU-konto. Sparer du inntil ${$(P.bsu.max_year)} i BSU i løpet av 2026, får du 10 % av beløpet i fradrag i skatten, altså inntil ${$(P.bsu.max_year * P.bsu.rate)}. Fradraget gjelder til og med året du fyller 33 år, og samlet sparing kan være inntil ${$(P.bsu.max_total)}. Uten BSU betaler du ${$(a.totalTax)} i skatt på denne lønnen og sitter igjen med ${$(a.net)}. Med full BSU-sparing blir skatten ${$(c(450000, { bsu: P.bsu.max_year }).annual.totalTax)}. Fradraget går direkte til fratrekk i skatten, ikke i inntekten, og er derfor like mye verdt uansett lønnsnivå, så lenge du har skatt å trekke det fra. Pengene på kontoen er bundet til boligkjøp.`,
      h2b: 'Månedslønn',
      p2: `Uten BSU blir nettolønnen ${$(a.net / 12)} i snitt per måned, og ${$(t.normalMonthNet)} i en vanlig måned med tabelltrekk. BSU-fradraget kommer først med skatteoppgjøret, med mindre du endrer skattekortet.`,
      faqs: [
        { q: 'Hvor mye er 450 000 kr etter skatt?', a: `${$(a.net)} i året, eller ${$(a.net / 12)} i måneden i snitt, for 2026. Skatten er ${$(a.totalTax)}, som er ${pct(a.effective)} av lønnen. Med full BSU-sparing på ${$(P.bsu.max_year)} blir skatten ${$(P.bsu.max_year * P.bsu.rate)} lavere. Fradraget gjelder bare til og med året du fyller 33.` },
        { q: 'Hvor mye sparer jeg i skatt med BSU?', a: `10 % av det du setter inn i løpet av året, inntil ${$(P.bsu.max_year * P.bsu.rate)} når du sparer maksimalt ${$(P.bsu.max_year)}. Fradraget gis til og med året du fyller 33 år, og samlet BSU-sparing kan ikke overstige ${$(P.bsu.max_total)}. Det kommer med skatteoppgjøret.` },
        { q: 'Kan jeg få BSU-fradraget med på skattekortet?', a: 'Ja. Legger du inn den planlagte BSU-sparingen når du endrer skattekortet hos Skatteetaten, blir trekket justert gjennom året. Ellers får du fradraget som tilgode i skatteoppgjøret våren etter. Resultatet for året er det samme. Fradraget gis bare så lenge du har skatt å trekke det fra.' },
      ] }),
    500000: () => ({ h1,
      title: `500 000 kr etter skatt 2026: netto og arbeidsgiverkostnad`, description: `En halv million i lønn gir ${$(a.net)} etter skatt i 2026. Arbeidsgiveren betaler ${$(employerCost({ gross: 500000 }).total)} når avgift og pensjon kommer i tillegg.`,
      h2: 'Hva en halv million koster og gir',
      p: `En årslønn på ${$(500000)} gir ${$(a.net)} etter skatt i 2026, ${$(a.net / 12)} i måneden i snitt. Skatten er ${$(a.totalTax)}, fordelt på ${$(a.skattAlminnelig)} i skatt på alminnelig inntekt, ${$(a.trygdeavgift)} i trygdeavgift og ${$(a.trinnskatt)} i trinnskatt. På den andre siden av lønnsslippen betaler arbeidsgiveren mer enn lønnen. Obligatorisk tjenestepensjon er minst 2 % av lønnen, ${$(employerCost({ gross: 500000 }).otp)}, og arbeidsgiveravgiften i sone 1 er 14,1 % av lønn og pensjonsinnskudd, ${$(employerCost({ gross: 500000 }).aga)}. Samlet kostnad blir ${$(employerCost({ gross: 500000 }).total)}. Av det arbeidsgiveren betaler, ender altså ${pct(a.net / employerCost({ gross: 500000 }).total)} i lommen din som nettolønn. I sone 5, Finnmark og Nord-Troms, er arbeidsgiveravgiften null, og samme lønn koster ${$(employerCost({ gross: 500000, zone: '5' }).total)}. Kostnaden for arbeidsgiveren er altså mye høyere enn lønnen du ser i kontrakten.`,
      h2b: 'Marginalskatt',
      p2: `På dette nivået er marginalskatten ${pct(a.marginal)}. Den stiger først ved ${$(T[2].from)}, når trinn 3 i trinnskatten tar over.`,
      faqs: [
        { q: 'Hvor mye er 500 000 kr etter skatt i måneden?', a: `${$(a.net / 12)} i snitt per måned, og ${$(t.normalMonthNet)} i en vanlig måned med tabelltrekk. Den samlede skatten for 2026 er ${$(a.totalTax)}, ${pct(a.effective)} av lønnen, beregnet for skatteklasse 1 uten andre fradrag enn standardfradragene. Juni og desember gir mer.` },
        { q: 'Hva koster en ansatt med 500 000 kr i lønn?', a: `Omtrent ${$(employerCost({ gross: 500000 }).total)} i året i sone 1: lønn, ${$(employerCost({ gross: 500000 }).otp)} i minimum tjenestepensjon og ${$(employerCost({ gross: 500000 }).aga)} i arbeidsgiveravgift. Forsikringer, utstyr og lokaler kommer i tillegg og er ikke med i beregningen. I sone 5 er arbeidsgiveravgiften null, og kostnaden blir ${$(employerCost({ gross: 500000, zone: '5' }).total)}.` },
        { q: 'Er 500 000 kr en god lønn i Norge?', a: `Den ligger under gjennomsnittet. SSB oppgir en gjennomsnittlig månedslønn på ${$(P.ssb.avg_month_nov2025)} for heltidsekvivalenter i november 2025, som tilsvarer rundt ${$(avgYear)} i året. En lønn på ${$(500000)} er likevel vanlig i mange yrker og for nyutdannede.` },
      ] }),
    550000: () => ({ h1,
      title: `550 000 kr etter skatt 2026: rentefradrag og fagforening`, description: `550 000 kr i året gir ${$(a.net)} etter skatt. Boliglån og fagforening senker skatten: hver krone i fradrag er verdt 22 øre. Se regnestykket for 2026.`,
      h2: 'Fradrag som senker skatten',
      p: `På ${$(550000)} i lønn betaler du ${$(a.totalTax)} i skatt og får ${$(a.net)} utbetalt i løpet av året, uten andre fradrag enn minstefradraget og personfradraget. Mange på dette lønnsnivået har boliglån. Renteutgifter trekkes fra i alminnelig inntekt, og hver krone i renter gir 22 øre lavere skatt. Med ${$(60000)} i renter blir skatten ${$(c(550000, { interest: 60000 }).annual.totalTax)}, altså ${$(a.totalTax - c(550000, { interest: 60000 }).annual.totalTax)} lavere. Fagforeningskontingent gir fradrag inntil ${$(P.fagforening_max)} i 2026, som er verdt ${$(P.fagforening_max * 0.22)} i skatt. Fradragene påvirker ikke trygdeavgift og trinnskatt, som beregnes av bruttolønnen. Legger du fradragene inn på skattekortet, får du effekten hver måned i stedet for som tilgode i skatteoppgjøret. Fradrag for reiser mellom hjem og arbeid gis bare for kostnader over ${$(P.reisefradrag.threshold)} i året.`,
      h2b: 'Uten fradrag',
      p2: `Uten renter og kontingent er nettolønnen ${$(a.net / 12)} i snitt per måned og ${$(t.normalMonthNet)} i en vanlig måned med tabelltrekk.`,
      faqs: [
        { q: 'Hva er 550 000 kr etter skatt?', a: `${$(a.net)} i året for 2026, eller ${$(a.net / 12)} i måneden i snitt, uten rentefradrag eller andre fradrag. Skatten er ${$(a.totalTax)}. Har du boliglån, blir skatten lavere med 22 % av renteutgiftene, og nettolønnen tilsvarende høyere.` },
        { q: 'Hvor mye er rentefradraget verdt?', a: `22 % av renteutgiftene, fordi renter trekkes fra i alminnelig inntekt som beskattes med 22 %. Betaler du ${$(60000)} i renter i året, sparer du ${$(60000 * 0.22)} i skatt. I Finnmark og Nord-Troms er satsen 18,5 %, så fradraget er litt mindre verdt der.` },
        { q: 'Hvor mye fagforeningskontingent kan jeg trekke fra?', a: `Inntil ${$(P.fagforening_max)} for inntektsåret 2026. Fradraget gis i alminnelig inntekt og er verdt 22 % av beløpet i skatt. Betalte du kontingent bare deler av året, får du fradrag for det du faktisk har betalt. Arbeidsgiveren rapporterer ofte beløpet automatisk.` },
      ] }),
    600000: () => ({ h1,
      title: `600 000 kr etter skatt 2026: feriepenger og juni-lønn`, description: `600 000 kr i året gir ${$(a.net)} etter skatt. Feriepengene på ${$(feriepenger({ basis: 600000 }).total)} utbetales i juni uten skattetrekk. Slik blir utbetalingene i 2026.`,
      h2: 'Feriepenger i juni',
      p: `Med ${$(600000)} i årslønn opptjener du ${$(feriepenger({ basis: 600000 }).total)} i feriepenger, 10,2 % av lønnen, som utbetales i juni året etter. Har du fem ukers ferie etter tariffavtale, er satsen 12 %, og feriepengene blir ${$(feriepenger({ basis: 600000, fiveWeeks: true }).total)}. Det trekkes ikke skatt av feriepengene i juni når du har tabellkort, fordi skatten på dem allerede er fordelt på årets andre måneder. Mange opplever derfor juni som den beste lønnsmåneden. For en månedslønnet trekkes samtidig lønnen for feriedagene, så overskuddet er mindre enn feriepengebeløpet. Over året betaler du ${$(a.totalTax)} i skatt og får ${$(a.net)} utbetalt, ${pct(a.effective)} i gjennomsnittsskatt. I en vanlig måned er skattetrekket rundt ${$(t.normalMonthTax)} og utbetalingen ${$(t.normalMonthNet)}. Juni blir derfor ikke en ekstra lønn, men en måned uten skattetrekk.`,
      h2b: 'Marginalskatt og lønnsøkning',
      p2: `Marginalskatten er ${pct(a.marginal)}. En lønnsøkning på ${$(20000)} gir derfor rundt ${$(20000 * (1 - a.marginal))} mer etter skatt i året.`,
      faqs: [
        { q: 'Hvor mye er 600 000 kr etter skatt per måned?', a: `${$(a.net / 12)} i snitt over tolv måneder og ${$(t.normalMonthNet)} i en vanlig måned med tabelltrekk. Samlet skatt for 2026 er ${$(a.totalTax)}. Beløpene gjelder skatteklasse 1 med minstefradrag og personfradrag. I juni trekkes ingen skatt. Desember gir halv skatt.` },
        { q: 'Hvor mye feriepenger får jeg av 600 000 kr?', a: `${$(feriepenger({ basis: 600000 }).total)} med lovens sats på 10,2 %, eller ${$(feriepenger({ basis: 600000, fiveWeeks: true }).total)} med 12 % ved fem ukers ferie. Er du 60 år eller eldre, kommer et tillegg på 2,3 % av grunnlaget, ${$(feriepenger({ basis: 600000, over60: true }).extra)}. Tillegget gjelder den som fyller 60 år i ferieåret.` },
        { q: 'Trekkes det skatt av feriepengene?', a: 'Ikke i juni når du har tabellkort. Feriepengene er likevel skattepliktige: skatten på dem er fordelt på de 10,5 månedene med trekk. Har du prosentkort, trekkes prosentsatsen også av feriepengene. Skatteoppgjøret viser om trekket totalt var riktig. Trekket skjer i så fall i juni som i andre måneder.' },
      ] }),
    650000: () => ({ h1,
      title: `650 000 kr etter skatt 2026: overtid og marginalskatt`, description: `650 000 kr i året gir ${$(a.net)} etter skatt i 2026. En overtidstime med 40 % tillegg gir ${$(overtime({ gross: 650000, hours: 1 }).pay)} brutto og ${$(overtime({ gross: 650000, hours: 1 }).net)} netto.`,
      h2: 'Hva overtiden gir etter skatt',
      p: `På ${$(650000)} i året er timelønnen omtrent ${$(650000 / P.overtid.hours_year, 2)} når lønnen deles på ${P.overtid.hours_year} timer, en vanlig årsnorm for 37,5 timer i uken. Arbeidsmiljøloven krever minst 40 % tillegg for overtid, slik at en overtidstime gir ${$(overtime({ gross: 650000, hours: 1 }).pay)} før skatt. Fordi overtiden kommer på toppen av lønnen, beskattes den med marginalskatten, ${pct(a.marginal)}, og ti overtidstimer gir ${$(overtime({ gross: 650000, hours: 10 }).net)} etter skatt av ${$(overtime({ gross: 650000, hours: 10 }).pay)} brutto. Mange ser at skattetrekket i måneden med overtid blir høyt: tabelltrekket regner som om månedens lønn gjelder hele året. Det jevner seg ut i skatteoppgjøret. Uten overtid betaler du ${$(a.totalTax)} i skatt og får ${$(a.net)} utbetalt i løpet av 2026. Marginalskatten gjelder også en eventuell bonus eller et tillegg.`,
      h2b: 'Grenser for overtid',
      p2: `Loven tillater som hovedregel inntil ${P.overtid.max_week} timer overtid i uken, ${P.overtid.max_4_weeks} timer over fire uker og ${P.overtid.max_year} timer i året. Avtaler kan gi høyere grenser.`,
      faqs: [
        { q: 'Hvor mye er 650 000 kr etter skatt?', a: `${$(a.net)} i året, eller ${$(a.net / 12)} i snitt per måned, for inntektsåret 2026. Samlet skatt er ${$(a.totalTax)}, som tilsvarer ${pct(a.effective)} av lønnen. I en vanlig måned med tabelltrekk får du rundt ${$(t.normalMonthNet)}.` },
        { q: 'Hvordan beskattes overtid?', a: `Som vanlig lønn, men den kommer på toppen av årslønnen og beskattes derfor med marginalskatten, ${pct(a.marginal)} på dette nivået. Tabelltrekket i måneden med overtid kan bli høyere enn den endelige skatten, fordi tabellen antar at månedslønnen gjelder hele året.` },
        { q: 'Hva er timelønnen min med 650 000 kr i året?', a: `Omtrent ${$(650000 / P.overtid.hours_year, 2)} når årslønnen deles på ${P.overtid.hours_year} timer, som tilsvarer 37,5 timer i uken. Noen avtaler bruker en annen deler, for eksempel 1 850 timer. Overtidssatsen med 40 % tillegg blir ${$(650000 / P.overtid.hours_year * 1.4, 2)}. Timelønnen brukes også for å beregne trekk ved fravær.` },
      ] }),
    700000: () => ({ h1,
      title: `700 000 kr etter skatt 2026: like under trinn 3 i skatten`, description: `700 000 kr i året gir ${$(a.net)} etter skatt i 2026. Lønnen ligger ${$(T[2].from - 700000)} under trinn 3, der marginalskatten hopper til ${pct(c(750000).annual.marginal)}.`,
      h2: 'Rett før det store hoppet',
      p: `Med ${$(700000)} i årslønn betaler du ${$(a.totalTax)} i skatt for 2026 og får ${$(a.net)} utbetalt. Marginalskatten er ${pct(a.marginal)}, men den gjelder bare til ${$(T[2].from)}. Der starter trinn 3 i trinnskatten, og satsen for den delen av lønnen som ligger over, stiger fra 4,0 % til 13,7 %. Marginalskatten blir dermed ${pct(c(750000).annual.marginal)}, det største hoppet i det norske skattesystemet for lønnstakere. En lønnsøkning fra ${$(700000)} til ${$(750000)} gir ${$(c(750000).annual.net - a.net)} mer etter skatt av ${$(50000)} i brutto. Det lønner seg fortsatt å tjene mer, fordi bare delen over innslagspunktet beskattes med den høye satsen, men gevinsten per krone blir merkbart mindre. Trinn 3 har samme sats i hele landet fra 2024.`,
      h2b: 'Per måned',
      p2: `Nettolønnen er ${$(a.net / 12)} i snitt per måned og ${$(t.normalMonthNet)} i en vanlig måned med tabelltrekk på omtrent ${$(t.normalMonthTax)}.`,
      faqs: [
        { q: 'Hvor mye er 700 000 kr etter skatt?', a: `${$(a.net)} i året og ${$(a.net / 12)} i snitt per måned for 2026. Skatten er ${$(a.totalTax)}: ${$(a.skattAlminnelig)} på alminnelig inntekt, ${$(a.trygdeavgift)} i trygdeavgift og ${$(a.trinnskatt)} i trinnskatt. Gjennomsnittsskatten er ${pct(a.effective)}.` },
        { q: 'Når starter trinn 3 i trinnskatten?', a: `Ved ${$(T[2].from)} i personinntekt i 2026. Inntekt mellom ${$(T[2].from)} og ${$(T[3].from)} beskattes med 13,7 % i trinnskatt. Personinntekt er bruttolønnen før fradrag, så det er lønnen på lønnsslippen, ikke skattegrunnlaget etter fradrag, som avgjør trinnet.` },
        { q: 'Lønner det seg å gå over trinn 3?', a: `Ja. Bare den delen av lønnen som ligger over ${$(T[2].from)}, får den høyere satsen. Av en krone over grensen beholder du rundt ${pct(1 - c(750000).annual.marginal)}. Det finnes ingen inntekt der en lønnsøkning gir mindre utbetalt totalt. En lønnsøkning gir alltid mer netto enn før.` },
      ] }),
    750000: () => ({ h1,
      title: `750 000 kr etter skatt 2026: gjennomsnittslønn i Norge`, description: `750 000 kr er omtrent gjennomsnittslønnen i Norge. Etter skatt blir det ${$(a.net)} i 2026, og hver ny krone beskattes med ${pct(a.marginal)} i trinn 3.`,
      h2: 'Omtrent en gjennomsnittslønn',
      p: `SSB oppgir en gjennomsnittlig månedslønn på ${$(P.ssb.avg_month_nov2025)} for heltidsekvivalenter i november 2025, som tilsvarer ${$(avgYear)} i året. En lønn på ${$(750000)} er altså omtrent på gjennomsnittet. Etter skatt blir det ${$(a.net)} i 2026, eller ${$(a.net / 12)} i snitt per måned. Samlet skatt er ${$(a.totalTax)}, og gjennomsnittsskatten ${pct(a.effective)}. Lønnen ligger ${$(750000 - T[2].from)} over innslagspunktet for trinn 3, så marginalskatten er ${pct(a.marginal)}: 22 % på alminnelig inntekt, 7,6 % trygdeavgift og 13,7 % trinnskatt. Gjennomsnittet trekkes opp av høye lønninger, og medianlønnen, den midterste lønnen, er lavere. Sammenlign derfor også med lønnsstatistikken for ditt yrke før du vurderer om din egen lønn er høy eller lav. Medianlønnen fra SSB er et bedre mål for en typisk lønn.`,
      h2b: 'Tabelltrekk',
      p2: `Med tabellkort trekkes omtrent ${$(t.normalMonthTax)} i en vanlig måned, og utbetalingen blir ${$(t.normalMonthNet)}. I desember er trekket halvert.`,
      faqs: [
        { q: 'Hva er 750 000 kr etter skatt?', a: `${$(a.net)} i året, ${$(a.net / 12)} i snitt per måned, for inntektsåret 2026. Skatten er ${$(a.totalTax)}, som er ${pct(a.effective)} av lønnen. Beløpene gjelder skatteklasse 1 uten andre fradrag enn minstefradrag og personfradrag. I en vanlig måned får du ${$(t.normalMonthNet)}.` },
        { q: 'Er 750 000 kr over gjennomsnittslønnen?', a: `Omtrent på den. SSB oppgir ${$(P.ssb.avg_month_nov2025)} i måneden for heltidsekvivalenter i november 2025, rundt ${$(avgYear)} i året. Menn hadde ${$(P.ssb.avg_month_men)} og kvinner ${$(P.ssb.avg_month_women)} i snitt. Lønningene økte med ${pct(P.ssb.growth)} fra året før. Tallene gjelder heltidsekvivalenter i alle sektorer.` },
        { q: 'Hvorfor er marginalskatten så høy på 750 000 kr?', a: `Fordi lønnen er over ${$(T[2].from)}, der trinn 3 i trinnskatten gir 13,7 %. Sammen med 22 % skatt på alminnelig inntekt og 7,6 % trygdeavgift blir marginalskatten ${pct(a.marginal)}. Gjennomsnittsskatten er likevel bare ${pct(a.effective)}. Forskjellen skyldes trinnene i trinnskatten.` },
      ] }),
    800000: () => ({ h1,
      title: `800 000 kr etter skatt 2026: feriepenger over 60 og 6 G`, description: `800 000 kr i året gir ${$(a.net)} etter skatt. For deg over 60 år gir lønnen nesten fullt ekstra feriepengetillegg, som har et tak på 6 G, ${$(6 * G)}.`,
      h2: 'Tillegget for 60 år og over',
      p: `Arbeidstakere som fyller 60 år i løpet av ferieåret, får en ekstra ferieuke og et tillegg i feriepengene på 2,3 prosentpoeng. Tillegget beregnes bare av den delen av feriepengegrunnlaget som ikke overstiger seks ganger grunnbeløpet slik det er per 31. desember i opptjeningsåret. For lønn opptjent i 2026 er G ${$(G)}, og taket blir ${$(6 * G)}. På ${$(800000)} i grunnlag får du ordinære feriepenger på ${$(feriepenger({ basis: 800000 }).base)} og et tillegg på ${$(feriepenger({ basis: 800000, over60: true }).extra)}, i alt ${$(feriepenger({ basis: 800000, over60: true }).total)}. Tjener du mer enn ${$(6 * G)}, stopper tillegget ved ${$(feriepenger({ basis: 2000000, over60: true }).extra)}. Selve lønnen gir ${$(a.net)} etter skatt i 2026, med ${$(a.totalTax)} i skatt og en marginalskatt på ${pct(a.marginal)}, fordi lønnen ligger i trinn 3.`,
      h2b: 'Per måned',
      p2: `Nettolønnen er ${$(a.net / 12)} i snitt per måned og ${$(t.normalMonthNet)} i en vanlig måned med tabelltrekk.`,
      faqs: [
        { q: 'Hvor mye er 800 000 kr etter skatt?', a: `${$(a.net)} i året for 2026, ${$(a.net / 12)} i snitt per måned. Skatten er ${$(a.totalTax)}, og gjennomsnittsskatten ${pct(a.effective)}. Marginalskatten er ${pct(a.marginal)} fordi lønnen ligger i trinn 3 i trinnskatten. I en vanlig måned med tabelltrekk får du ${$(t.normalMonthNet)}.` },
        { q: 'Hvor mye er 6 G i 2026?', a: `${$(6 * G)}, med grunnbeløpet på ${$(G)} fra 1. mai 2026. Taket brukes blant annet for det ekstra feriepengetillegget for arbeidstakere over 60 år, og for dagpenger og sykepenger fra NAV, som ikke dekker inntekt over 6 G.` },
        { q: 'Hvor mye er feriepengene på 800 000 kr?', a: `${$(feriepenger({ basis: 800000 }).base)} med 10,2 %, eller ${$(feriepenger({ basis: 800000, fiveWeeks: true }).base)} med 12 % ved fem ukers ferie. Er du 60 år eller eldre, kommer ${$(feriepenger({ basis: 800000, over60: true }).extra)} i tillegg. Feriepengene utbetales normalt i juni året etter opptjeningen. Feriepengene er skattepliktige som lønn.` },
      ] }),
    900000: () => ({ h1,
      title: `900 000 kr etter skatt 2026: nettolønn og tjenestepensjon`, description: `900 000 kr i året gir ${$(a.net)} etter skatt i 2026. Arbeidsgiveren betaler minst ${$(employerCost({ gross: 900000 }).otp)} i tjenestepensjon og ${$(employerCost({ gross: 900000 }).aga)} i avgift.`,
      h2: 'Pensjon og avgift på toppen',
      p: `På ${$(900000)} i lønn betaler du ${$(a.totalTax)} i skatt for 2026 og får ${$(a.net)} utbetalt. Trinnskatten alene er ${$(a.trinnskatt)}, fordi en stor del av lønnen ligger i trinn 3. Arbeidsgiveren betaler i tillegg obligatorisk tjenestepensjon, minst 2 % av lønnen opp til 12 G, ${$(employerCost({ gross: 900000 }).otp)}, og mange bedrifter på dette lønnsnivået har høyere sparesatser. Med 5 % blir innskuddet ${$(employerCost({ gross: 900000, otpRate: 0.05 }).otp)}. Pensjonsinnskuddet er ikke skattepliktig for deg når det betales inn, men arbeidsgiveren betaler arbeidsgiveravgift også av det. Samlet kostnad for arbeidsgiveren er ${$(employerCost({ gross: 900000 }).total)} med minimumspensjon i sone 1. Sammenlign derfor pensjonsordningen når du vurderer to jobbtilbud: forskjellen mellom 2 % og 7 % er ${$(900000 * 0.05)} i året.`,
      h2b: 'Marginalskatt',
      p2: `Marginalskatten er ${pct(a.marginal)} til ${$(T[3].from)}, der trinn 4 starter. En bonus på ${$(50000)} gir omtrent ${$(c(950000).annual.net - a.net)} etter skatt.`,
      faqs: [
        { q: 'Hvor mye er 900 000 kr etter skatt?', a: `${$(a.net)} i året og ${$(a.net / 12)} i snitt per måned for 2026. Samlet skatt er ${$(a.totalTax)}, ${pct(a.effective)} av lønnen. I en vanlig måned med tabelltrekk får du rundt ${$(t.normalMonthNet)} utbetalt. Marginalskatten er ${pct(a.marginal)}.` },
        { q: 'Hvor mye tjenestepensjon må arbeidsgiveren betale?', a: `Minst 2 % av lønnen fra første krone opp til 12 G, som er ${$(12 * G)} fra 1. mai 2026. På ${$(900000)} blir minimumsinnskuddet ${$(employerCost({ gross: 900000 }).otp)} i året. Mange arbeidsgivere betaler mer, ofte 5 til 7 % over 7,1 G.` },
        { q: 'Hvor mye skatt betaler jeg på en bonus på 900 000 kr?', a: `Omtrent ${pct(a.marginal)} av bonusen, som er marginalskatten din. En bonus på ${$(50000)} gir derfor rundt ${$(c(950000).annual.net - a.net)} etter skatt. Utbetales bonusen i desember, trekkes det ofte bare halv skatt, men sluttskatten blir den samme. Skatteoppgjøret retter opp eventuelle avvik i trekket.` },
      ] }),
    1000000: () => ({ h1,
      title: `1 million etter skatt 2026: millionlønn og trinn 4`, description: `En million kroner i lønn gir ${$(a.net)} etter skatt i 2026. Lønnen har passert trinn 4 ved ${$(T[3].from)}, og marginalskatten er ${pct(a.marginal)}.`,
      h2: 'Hva som blir igjen av en million',
      p: `Med ${$(1000000)} i årslønn betaler du ${$(a.totalTax)} i skatt for 2026 og får ${$(a.net)} utbetalt, ${$(a.net / 12)} i snitt per måned. Gjennomsnittsskatten er ${pct(a.effective)}. Lønnen ligger ${$(1000000 - T[3].from)} over innslagspunktet for trinn 4, ${$(T[3].from)}, der trinnskatten stiger til 16,8 %. Marginalskatten blir dermed ${pct(a.marginal)}: av hver ekstra krone går ${pct(a.marginal)} til skatt. Trinnskatten utgjør nå ${$(a.trinnskatt)}, nesten like mye som trygdeavgiften på ${$(a.trygdeavgift)}. Skatten på alminnelig inntekt, ${$(a.skattAlminnelig)}, øker bare med 22 % av inntekten, fordi minstefradraget har nådd taket på ${$(P.minstefradrag.max)}. Millionlønn er uvanlig blant lønnstakere, men vanlig i ledende stillinger, olje og finans. Hver lønnsøkning herfra gir litt over halvparten i netto.`,
      h2b: 'Formue ved høy inntekt',
      p2: `Høy inntekt bygger ofte formue. Formuesskatt betales først når nettoformuen overstiger ${$(P.formue.bunnfradrag)}, eller det dobbelte for ektefeller.`,
      faqs: [
        { q: 'Hvor mye er 1 million etter skatt?', a: `${$(a.net)} i året for 2026, eller ${$(a.net / 12)} i måneden i snitt. Skatten er ${$(a.totalTax)}: ${$(a.skattAlminnelig)} på alminnelig inntekt, ${$(a.trygdeavgift)} i trygdeavgift og ${$(a.trinnskatt)} i trinnskatt. Gjennomsnittsskatten er ${pct(a.effective)}.` },
        { q: 'Hva er marginalskatten på en million?', a: `${pct(a.marginal)} i 2026: 22 % på alminnelig inntekt, 7,6 % trygdeavgift og 16,8 % i trinn 4 av trinnskatten, som gjelder fra ${$(T[3].from)} til ${$(T[4].from)}. Over ${$(T[4].from)} er marginalskatten ${pct(c(1600000).annual.marginal)}.` },
        { q: 'Hvor mye trinnskatt betaler jeg på en million?', a: `${$(a.trinnskatt)} for 2026. Beløpet er summen av alle trinnene: 1,7 % mellom ${$(T[0].from)} og ${$(T[1].from)}, 4,0 % opp til ${$(T[2].from)}, 13,7 % opp til ${$(T[3].from)} og 16,8 % på det som ligger over.` },
      ] }),
    1500000: () => ({ h1,
      title: `1,5 millioner etter skatt 2026: toppskatt i trinn 5`, description: `1,5 millioner kroner i lønn gir ${$(a.net)} etter skatt i 2026. Over ${$(T[4].from)} gjelder trinn 5 med 17,8 %, og marginalskatten er ${pct(a.marginal)}.`,
      h2: 'Øverste trinn',
      p: `Trinn 5 i trinnskatten, 17,8 %, gjelder inntekt over ${$(T[4].from)} i 2026. Med ${$(1500000)} i lønn ligger ${$(1500000 - T[4].from)} i dette trinnet, og marginalskatten er ${pct(a.marginal)}, den høyeste satsen en lønnstaker kan få. Samlet skatt er ${$(a.totalTax)}, og du beholder ${$(a.net)}, ${$(a.net / 12)} i snitt per måned. Gjennomsnittsskatten er ${pct(a.effective)}. Obligatorisk tjenestepensjon dekker lønn opp til 12 G, ${$(12 * G)}, så på dette nivået er nesten hele lønnen med i minimumsordningen. Mange arbeidsgivere har egne ordninger for lønn over 12 G, som ikke er lovpålagt. Trinnskatten utgjør ${$(a.trinnskatt)}, mer enn trygdeavgiften, og er den største skatteposten etter skatten på alminnelig inntekt. Høye lønninger får også ofte bonus, som beskattes med den samme marginalskatten.`,
      h2b: 'Månedlig trekk',
      p2: `Med tabellkort trekkes omtrent ${$(t.normalMonthTax)} i en vanlig måned, og utbetalingen blir ${$(t.normalMonthNet)} av en bruttolønn på ${$(1500000 / 12)}.`,
      faqs: [
        { q: 'Hvor mye er 1,5 millioner etter skatt?', a: `${$(a.net)} i året, ${$(a.net / 12)} i snitt per måned, for inntektsåret 2026. Skatten er ${$(a.totalTax)}, som er ${pct(a.effective)} av lønnen. Beregningen forutsetter skatteklasse 1 og ingen andre fradrag enn minstefradrag og personfradrag. I en vanlig måned får du ${$(t.normalMonthNet)} med tabelltrekk.` },
        { q: 'Hva er den høyeste marginalskatten i Norge?', a: `${pct(a.marginal)} på lønn i 2026: 22 % på alminnelig inntekt, 7,6 % trygdeavgift og 17,8 % i trinn 5 av trinnskatten over ${$(T[4].from)}. I Finnmark og Nord-Troms er satsen på alminnelig inntekt 18,5 %, så toppsatsen er 3,5 poeng lavere.` },
        { q: 'Hvor mye er 12 G i 2026?', a: `${$(12 * G)}, med grunnbeløpet på ${$(G)} fra 1. mai 2026. Taket brukes for obligatorisk tjenestepensjon: arbeidsgiveren må spare minst 2 % av lønnen opp til denne grensen. Lønn over 12 G kan dekkes av en frivillig tilleggsordning.` },
      ] }),
  };
  return A[g]();
}

export function hourlyAngle(h: number): Angle {
  const g = hourlyToAnnual(h); const r = c(g); const a = r.annual;
  const h1 = `${h} kr timen: lønn per måned og år etter skatt`;
  const M = P.minstelonn;
  const A: Record<number, () => Angle> = {
    200: () => ({ h1, title: `200 kr timen etter skatt 2026: månedslønn og årslønn`, description: `200 kr timen i 37,5 timer i uken er ${$(g)} i året. Etter skatt blir det ${$(a.net / 12)} i måneden. Sammenlign med minstelønnen i allmenngjorte avtaler.`,
      h2: 'Nær flere minstelønnssatser',
      p: `Norge har ingen generell lovfestet minstelønn, men i noen bransjer er tariffavtalen gjort allmenngjort, slik at minstelønnen gjelder alle. ${$(200)} i timen ligger over minstelønnen i jordbruk og gartneri, ${$(M.jordbruk, 2)}, og for nyansatte i overnatting og servering, ${$(M.servering, 2)}, men under renhold, ${$(M.renhold, 2)}, og bygg, ${$(M.bygg_ufaglaert, 2)} for ufaglærte uten bransjeerfaring. I full stilling på 37,5 timer i uken blir timelønnen ${$(g)} i året. Skatten for 2026 er ${$(a.totalTax)}, og du får ${$(a.net)} utbetalt, ${$(a.net / 12)} i snitt per måned. Timelønnede får ikke betalt i ferien, men får feriepenger på 10,2 % av lønnen, som utbetales året etter. Feriepengene er ikke med i tallene her. Tallene forutsetter full stilling hele året.`,
      h2b: 'Feriepenger på toppen',
      p2: `Feriepengene av ${$(g)} blir ${$(feriepenger({ basis: g }).total)}, som erstatter lønnen i fire uker og en dag ferie.`,
      faqs: [
        { q: 'Hvor mye er 200 kr timen i måneden etter skatt?', a: `Omtrent ${$(a.net / 12)} i snitt per måned i full stilling på 37,5 timer i uken, av ${$(g / 12)} brutto. Årslønnen blir ${$(g)} og skatten ${$(a.totalTax)} for 2026. Feriepengene kommer i tillegg og utbetales året etter.` },
        { q: 'Er 200 kr timen over minstelønnen?', a: `Det avhenger av bransjen. Det er over minstelønnen i jordbruk, ${$(M.jordbruk, 2)}, og for nyansatte i servering, ${$(M.servering, 2)}, men under renhold for voksne, ${$(M.renhold, 2)}, og bygg. Utenfor allmenngjorte bransjer finnes ingen lovfestet minstelønn. Sjekk alltid tariffavtalen for din bransje.` },
        { q: 'Hvor mye er 200 kr timen i året?', a: `${$(g)} i 37,5 timer i uken i 52 uker. Jobber du 40 timer i uken, blir det ${$(200 * 40 * 52)}. Timelønnede får ikke lønn i ferien, men får feriepenger på 10,2 % av lønnen året etter, som dekker ferien.` },
      ] }),
    250: () => ({ h1, title: `250 kr timen etter skatt 2026: minstelønn i bygg og renhold`, description: `250 kr timen gir ${$(g)} i året i full stilling og ${$(a.net / 12)} i måneden etter skatt. Satsen ligger over minstelønnen i bygg og renhold i 2026.`,
      h2: 'Over minstelønnen i bygg og renhold',
      p: `En timelønn på ${$(250)} er over minstelønnen for ufaglærte i byggebransjen, ${$(M.bygg_ufaglaert, 2)}, og i renhold, ${$(M.renhold, 2)}, men under satsen for fagarbeidere i bygg, ${$(M.bygg_fagarbeider, 2)}. Satsene er allmenngjort og gjelder fra ${M.from.split('-').reverse().join('.')}. I full stilling blir timelønnen ${$(g)} i året, og skatten for 2026 er ${$(a.totalTax)}. Du får ${$(a.net)} utbetalt i løpet av året, ${$(a.net / 12)} i snitt per måned. Marginalskatten er ${pct(a.marginal)}, som også gjelder for overtid. Med minst 40 % tillegg gir en overtidstime ${$(250 * 1.4)} før skatt og omtrent ${$(250 * 1.4 * (1 - a.marginal))} etter skatt. Timelønnede i bygg har ofte rett til reise- og kostgodtgjørelse etter avtalen, som ikke er med her. Sjekk alltid den gjeldende avtalen. Reisetid kan også være betalt.`,
      h2b: 'Deltid',
      p2: `I halv stilling, 18,75 timer i uken, blir årslønnen ${$(g / 2)} og nettolønnen ${$(c(g / 2).annual.net / 12)} i snitt per måned.`,
      faqs: [
        { q: 'Hvor mye er 250 kr timen etter skatt?', a: `Omtrent ${$(a.net / 12)} i måneden i snitt i full stilling, av en bruttolønn på ${$(g / 12)}. Over året blir det ${$(a.net)} etter ${$(a.totalTax)} i skatt for 2026. Feriepengene på 10,2 % kommer i tillegg året etter.` },
        { q: 'Hva er minstelønnen i byggebransjen?', a: `${$(M.bygg_fagarbeider, 2)} i timen for fagarbeidere, ${$(M.bygg_ufaglaert, 2)} for ufaglærte uten bransjeerfaring og ${$(M.bygg_ufaglaert_1yr, 2)} for ufaglærte med minst ett års erfaring, gjeldende fra 15. juni 2025 ifølge Arbeidstilsynet. Arbeidstakere under 18 år har en lavere sats. Satsene justeres vanligvis når avtalen fornyes.` },
        { q: 'Hvor mye er overtid på 250 kr timen?', a: `Minst ${$(250 * 1.4)} i timen med lovens tillegg på 40 %. Etter skatt blir det rundt ${$(250 * 1.4 * (1 - a.marginal))}, fordi overtiden beskattes med marginalskatten på ${pct(a.marginal)}. Mange avtaler gir 50 % eller 100 % tillegg på kveld og helg. Sjekk hva avtalen din sier.` },
      ] }),
    300: () => ({ h1, title: `300 kr timen etter skatt 2026: årslønn og nettolønn`, description: `300 kr timen i full stilling gir ${$(g)} i året og ${$(a.net)} etter skatt i 2026. Se hva det blir i måneden, og hvordan feriepengene kommer i tillegg.`,
      h2: 'Timelønn og månedslønn',
      p: `${$(300)} i timen tilsvarer en årslønn på ${$(g)} i 37,5 timer i uken, eller ${$(g / 12)} i måneden. Det er et vanlig nivå for fagarbeidere og mange stillinger i offentlig sektor. For 2026 betaler du ${$(a.totalTax)} i skatt og får ${$(a.net)} utbetalt, ${$(a.net / 12)} i snitt per måned. Om du er fast ansatt med månedslønn eller timelønnet, påvirker hvordan ferien betales. Den fast ansatte får lønn hver måned og feriepenger i juni, der lønnen for feriedagene trekkes. Den timelønnede får betalt for timene som arbeides, og feriepenger på ${$(feriepenger({ basis: g }).total)} året etter. Over tid blir inntekten omtrent den samme, men timelønnede må selv sette av til ferien. Marginalskatten er ${pct(a.marginal)} på dette nivået.`,
      h2b: 'Med 40 timer i uken',
      p2: `Jobber du 40 timer i uken, blir årslønnen ${$(300 * 40 * 52)} og nettolønnen ${$(c(300 * 40 * 52).annual.net / 12)} i snitt per måned.`,
      faqs: [
        { q: 'Hvor mye er 300 kr timen i året?', a: `${$(g)} i 37,5 timer i uken over 52 uker, og ${$(300 * 40 * 52)} med 40 timer i uken. Etter skatt blir 37,5-timersvarianten ${$(a.net)} i året for 2026. Feriepengene kommer i tillegg for timelønnede. Beløpet gjelder skatteklasse 1.` },
        { q: 'Hvor mye er 300 kr timen i måneden etter skatt?', a: `Rundt ${$(a.net / 12)} i snitt per måned i full stilling på 37,5 timer. Med tabelltrekk får du omtrent ${$(r.tabell.normalMonthNet)} i en vanlig måned, fordi skatten fordeles over 10,5 måneder med skattefri juni og halv skatt i desember.` },
        { q: 'Hvordan regner jeg om timelønn til årslønn?', a: `Gang timelønnen med antall timer i året. Med 37,5 timer i uken er det ${P.overtid.hours_year} timer, så ${$(300)} i timen blir ${$(g)}. Andre vanlige delere er 1 950 og 1 850 timer; sjekk hva som står i arbeidsavtalen din.` },
      ] }),
    350: () => ({ h1, title: `350 kr timen etter skatt 2026: overtid og trinn 3 i skatten`, description: `350 kr timen gir ${$(g)} i året i full stilling. Etter skatt blir det ${$(a.net / 12)} i måneden, og overtid kan fort ta lønnen inn i trinn 3.`,
      h2: 'Overtid kan passere trinn 3',
      p: `Med ${$(350)} i timen i full stilling blir årslønnen ${$(g)}, som er ${$(T[2].from - g)} under innslagspunktet for trinn 3 i trinnskatten, ${$(T[2].from)}. Marginalskatten er ${pct(a.marginal)}. Men mange med denne timelønnen jobber overtid, og med 40 % tillegg er en overtidstime ${$(350 * 1.4)}. Etter omtrent ${Math.ceil((T[2].from - g) / (350 * 1.4))} overtidstimer i løpet av året passerer inntekten ${$(T[2].from)}, og overtiden over grensen beskattes med ${pct(c(T[2].from + 10000).annual.marginal)}. Uten overtid betaler du ${$(a.totalTax)} i skatt og får ${$(a.net)} utbetalt i 2026. Det er verdt å vite når du vurderer å ta ekstra vakter: de siste timene i året gir mindre netto enn de første. Samlet sett gir overtid likevel alltid mer penger i lommen.`,
      h2b: 'Per måned',
      p2: `Nettolønnen er ${$(a.net / 12)} i snitt per måned, og ${$(r.tabell.normalMonthNet)} i en vanlig måned med tabelltrekk.`,
      faqs: [
        { q: 'Hvor mye er 350 kr timen etter skatt?', a: `${$(a.net / 12)} i snitt per måned og ${$(a.net)} i året i full stilling på 37,5 timer i uken. Skatten for 2026 er ${$(a.totalTax)}. Feriepenger på 10,2 % kommer i tillegg året etter for timelønnede. Beløpene gjelder skatteklasse 1 uten andre fradrag.` },
        { q: 'Hvor mye overtid før jeg når trinn 3?', a: `Rundt ${Math.ceil((T[2].from - g) / (350 * 1.4))} timer med 40 % tillegg, fordi årslønnen i full stilling er ${$(g)} og trinn 3 starter ved ${$(T[2].from)}. Etter det beskattes overtiden med ${pct(c(T[2].from + 10000).annual.marginal)} i stedet for ${pct(a.marginal)}. Grensen gjelder samlet lønn for hele året.` },
        { q: 'Hva er 350 kr timen i året?', a: `${$(g)} med 37,5 timer i uken og ${$(350 * 40 * 52)} med 40 timer. Timelønnede får ikke lønn i ferien, så årsinntekten avhenger av hvor mange uker du faktisk jobber, men feriepengene dekker ferien året etter. Feriepengene utbetales normalt i juni.` },
      ] }),
    400: () => ({ h1, title: `400 kr timen etter skatt 2026: årslønn i trinn 3 av skatten`, description: `400 kr timen i full stilling gir ${$(g)} i året, over grensen for trinn 3. Etter skatt blir det ${$(a.net / 12)} i måneden og ${$(a.net)} i året.`,
      h2: 'Årslønn i trinn 3',
      p: `${$(400)} i timen i full stilling gir ${$(g)} i året, ${$(g - T[2].from)} over innslagspunktet for trinn 3 i trinnskatten. Hver ekstra krone beskattes derfor med ${pct(a.marginal)}. Samlet skatt for 2026 er ${$(a.totalTax)}, og du får ${$(a.net)} utbetalt, ${$(a.net / 12)} i snitt per måned. Timelønn på dette nivået er vanlig for konsulenter i vikarbyrå, fagarbeidere med tillegg og helsepersonell med kvelds- og helgetillegg. En overtidstime med 40 % tillegg gir ${$(400 * 1.4)} brutto og omtrent ${$(400 * 1.4 * (1 - a.marginal))} etter skatt. Er du selvstendig næringsdrivende og fakturerer ${$(400)} i timen, er regnestykket et annet: du betaler høyere trygdeavgift, får ingen feriepenger eller pensjon fra en arbeidsgiver og må dekke egne kostnader. Sammenlign derfor alltid samlet årsinntekt.`,
      h2b: 'Feriepenger',
      p2: `Som timelønnet får du ${$(feriepenger({ basis: g }).total)} i feriepenger året etter, beregnet av årets lønn.`,
      faqs: [
        { q: 'Hvor mye er 400 kr timen etter skatt?', a: `${$(a.net / 12)} i snitt per måned og ${$(a.net)} i året i full stilling for 2026. Skatten er ${$(a.totalTax)}, eller ${pct(a.effective)} av lønnen. Marginalskatten er ${pct(a.marginal)} fordi årslønnen ligger i trinn 3. Beløpet gjelder skatteklasse 1 uten andre fradrag.` },
        { q: 'Hva er 400 kr timen i årslønn?', a: `${$(g)} med 37,5 timer i uken, eller ${$(400 * 40 * 52)} med 40 timer. Det er litt over gjennomsnittslønnen, som SSB oppgir til ${$(P.ssb.avg_month_nov2025)} i måneden for heltidsekvivalenter i november 2025. Som timelønnet får du i tillegg feriepenger.` },
        { q: 'Er 400 kr timen det samme som selvstendig?', a: `Nei. En selvstendig næringsdrivende med ${$(400)} i timen betaler 10,8 % trygdeavgift i stedet for 7,6 %, har ingen feriepenger eller arbeidsgiverbetalt pensjon, og fakturerer sjelden alle timene i året. Timeprisen må derfor være betydelig høyere for å gi samme inntekt.` },
      ] }),
    500: () => ({ h1, title: `500 kr timen etter skatt 2026: like under trinn 4 i skatten`, description: `500 kr timen gir ${$(g)} i året i full stilling, like under trinn 4. Etter skatt blir det ${$(a.net / 12)} i måneden. Se hva det koster arbeidsgiveren.`,
      h2: 'Like under trinn 4',
      p: `En timelønn på ${$(500)} gir ${$(g)} i året i full stilling, ${$(T[3].from - g)} under innslagspunktet for trinn 4 i trinnskatten, ${$(T[3].from)}. Marginalskatten er ${pct(a.marginal)} og stiger til ${pct(c(T[3].from + 10000).annual.marginal)} over grensen. Samlet skatt for 2026 er ${$(a.totalTax)}, og du får ${$(a.net)} utbetalt. For arbeidsgiveren koster samme lønn ${$(employerCost({ gross: g }).total)} med minimum tjenestepensjon og arbeidsgiveravgift i sone 1, og ${$(employerCost({ gross: g, feriepengerOnTop: true }).total)} dersom feriepengene kommer på toppen, som for timelønnede. Timelønn på ${$(500)} er vanlig for spesialister, ingeniører og konsulenter. Innleide konsulenter faktureres ofte med høyere timepriser, fordi byrået dekker lønn, feriepenger, pensjon, arbeidsgiveravgift og tid uten oppdrag. Tallene gjelder full stilling hele året. Timeprisen sier derfor lite alene.`,
      h2b: 'Per måned',
      p2: `Nettolønnen er ${$(a.net / 12)} i snitt per måned og ${$(r.tabell.normalMonthNet)} i en vanlig måned med tabelltrekk.`,
      faqs: [
        { q: 'Hvor mye er 500 kr timen etter skatt?', a: `${$(a.net / 12)} i snitt per måned og ${$(a.net)} i året i full stilling på 37,5 timer i uken, for 2026. Skatten er ${$(a.totalTax)}. Som timelønnet får du i tillegg feriepenger på 10,2 % av lønnen året etter.` },
        { q: 'Hva koster en ansatt med 500 kr timen?', a: `Omtrent ${$(employerCost({ gross: g, feriepengerOnTop: true }).total)} i året i sone 1 når feriepenger, minimum tjenestepensjon og arbeidsgiveravgift kommer på toppen av ${$(g)} i lønn. Det tilsvarer rundt ${$(employerCost({ gross: g, feriepengerOnTop: true }).total / P.overtid.hours_year, 2)} per arbeidstime. Forsikringer og utstyr kommer i tillegg og er ikke med her.` },
        { q: 'Når starter trinn 4 i trinnskatten?', a: `Ved ${$(T[3].from)} i personinntekt for 2026. Inntekt mellom ${$(T[3].from)} og ${$(T[4].from)} beskattes med 16,8 %. Med ${$(500)} i timen og overtid passerer mange denne grensen i løpet av året. Over grensen gir hver krone mindre netto.` },
      ] }),
  };
  return A[h]();
}
