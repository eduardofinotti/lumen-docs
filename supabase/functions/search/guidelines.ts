// Lúmen · diretrizes brasileiras de sociedades médicas, encontradas no próprio PubMed (funções puras, testadas com vitest)
// A busca extra junta recall (revistas e sociedades brasileiras); isBrazilianGuideline decide a etiqueta.

/** Revistas onde as sociedades brasileiras publicam diretrizes, como o PubMed abrevia (ISO). */
const BRAZILIAN_JOURNALS = [
  "Arq Bras Cardiol", "Arch Endocrinol Metab", "Diabetol Metab Syndr", "Rev Assoc Med Bras (1992)",
  "J Pediatr (Rio J)", "J Bras Pneumol", "Adv Rheumatol", "Rev Bras Reumatol", "J Bras Nefrol",
  "Braz J Infect Dis", "Arq Gastroenterol", "Rev Bras Ginecol Obstet", "An Bras Dermatol",
  "Braz J Psychiatry", "Arq Neuropsiquiatr", "Hematol Transfus Cell Ther", "Crit Care Sci",
  "Rev Bras Ter Intensiva", "Rev Soc Bras Med Trop", "Epidemiol Serv Saude", "Braz J Anesthesiol",
  "Int Braz J Urol", "Braz J Otorhinolaryngol", "Arq Bras Oftalmol", "Radiol Bras",
  "Braz J Cardiovasc Surg", "Rev Col Bras Cir", "Einstein (Sao Paulo)", "Sao Paulo Med J",
];

const SOCIETIES = [
  "Sociedade Brasileira", "Brazilian Society", "Associação Brasileira", "Brazilian Association",
  "Brazilian College", "Colégio Brasileiro", "Brazilian Federation", "Federação Brasileira",
];

const GUIDELINE_FILTER = [
  "Guideline[pt]", '"Practice Guideline"[pt]', '"Consensus Development Conference"[pt]', '"Consensus Statement"[pt]',
  "guideline*[ti]", "diretriz*[ti]", "consenso[ti]", "consensus[ti]", '"position statement"[ti]',
  "posicionamento[ti]", "recommendations[ti]", "recomendações[ti]",
].join(" OR ");

const BRAZIL_FILTER = [
  ...BRAZILIAN_JOURNALS.map((j) => `"${j}"[ta]`),
  ...SOCIETIES.map((s) => `"${s}"[ad]`),
  "brazil*[ti]", "brasil*[ti]",
].join(" OR ");

/** A busca do tema restrita a diretrizes e consensos de origem brasileira. */
export function brazilianGuidelineQuery(topicQuery: string): string {
  return `(${topicQuery}) AND (${GUIDELINE_FILTER}) AND (${BRAZIL_FILTER})`;
}

/** Diretriz envelhece: com "qualquer data", só os últimos 10 anos. */
export function guidelineDays(dateRange: "1y" | "5y" | "all"): number {
  return dateRange === "1y" ? 365 : dateRange === "5y" ? 1826 : 3652;
}

const GUIDELINE_TYPES = ["guideline", "practice guideline", "consensus development conference", "consensus statement"];
const GUIDELINE_TITLE = /diretriz|guideline|consenso|consensus|position statement|posicionamento|recomenda[çc][õo]es|recommendations/i;
/** Estudo sobre diretrizes (revisão, avaliação de qualidade), não a diretriz em si. */
const ABOUT_GUIDELINES = /\b(overview|appraisal|assessment|adherence|compliance)\b/i;
const REVIEW_TYPES = ["review", "systematic review", "meta-analysis"];

export function isBrazilianGuideline(a: { publicationTypes: string[]; title: string; journal: string }): boolean {
  const types = a.publicationTypes.map((t) => t.toLowerCase());
  const guideline = types.some((t) => GUIDELINE_TYPES.includes(t)) ||
    (GUIDELINE_TITLE.test(a.title) && !ABOUT_GUIDELINES.test(a.title) && !types.some((t) => REVIEW_TYPES.includes(t)));
  // Revista de sociedade brasileira basta; em revista de fora, só com o tipo diretriz e Brasil no título.
  if (BRAZILIAN_JOURNALS.includes(a.journal)) return guideline;
  return types.some((t) => GUIDELINE_TYPES.includes(t)) && /bra[sz]il/i.test(a.title);
}

const MAX_GUIDELINES = 3;

/** Diretrizes brasileiras no topo (até 3), depois os artigos da busca geral sem repetir. */
export function mergeWithGuidelines<T extends { pmid: string }>(guidelines: T[], general: T[], max: number): T[] {
  const top = guidelines.slice(0, MAX_GUIDELINES);
  const seen = new Set(top.map((a) => a.pmid));
  return [...top, ...general.filter((a) => !seen.has(a.pmid))].slice(0, max);
}
