// Lúmen · preprints do medRxiv pelo Europe PMC (funções puras, testadas com vitest)
// Preprint ainda não passou por revisão por pares: entra no fim da lista, com etiqueta própria.

import { decodeEntities } from "./answer.ts";

/** Campos que usamos do registro "core" da busca do Europe PMC. */
export type EuropePmcRecord = {
  id: string;
  source: string;
  doi?: string;
  title?: string;
  authorString?: string;
  authorList?: { author?: { lastName?: string; initials?: string }[] };
  firstPublicationDate?: string;
  abstractText?: string;
  bookOrReportDetails?: { publisher?: string };
  commentCorrectionList?: { commentCorrection?: { type?: string; id?: string; source?: string }[] };
};

export type Preprint = {
  pmid: string; title: string; authors: string; journal: string; year: number | null;
  volume: null; issue: null; pages: null; pmcid: null; doi: string | null;
  publicationTypes: string[]; abstract: string; url: string;
  evidenceLevel: "low"; evidenceLabel: "Preprint"; retracted: false;
};

const FIELDS = "MeSH Terms|MeSH|mh|Title/Abstract|tiab|Title|ti";

/** A busca do PubMed na sintaxe do Europe PMC: título e resumo (preprint não tem MeSH), só medRxiv, no período. */
export function toEuropePmcQuery(pubmedQuery: string, days: number, today: Date = new Date()): string {
  const topic = pubmedQuery
    .replace(/\s*AND\s+humans\[(MeSH Terms|mh)\]/gi, "")
    .replace(/humans\[(MeSH Terms|mh)\]\s*AND\s*/gi, "")
    .replace(new RegExp(`"([^"]+)"\\[(${FIELDS})\\]`, "gi"), 'TITLE_ABS:"$1"')
    .replace(new RegExp(`([^\\s()"]+)\\[(${FIELDS})\\]`, "gi"), "TITLE_ABS:$1")
    .replace(/("[^"]+"|[^\s()"]+)\[[^\]]+\]/g, "$1")
    .trim();
  const from = new Date(today.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);
  return `${topic} AND SRC:PPR AND PUBLISHER:"medRxiv" AND FIRST_PDATE:[${from} TO ${to}]`;
}

/** Com "qualquer data", 5 anos: preprint antigo que nunca saiu em revista é sinal ruim. */
export function preprintDays(dateRange: "1y" | "5y" | "all"): number {
  return dateRange === "1y" ? 365 : 1826;
}

const strip = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** Registro do Europe PMC como artigo; null se já saiu em revista (está no PubMed) ou se falta título ou resumo. */
export function parsePreprint(r: EuropePmcRecord): Preprint | null {
  const published = r.commentCorrectionList?.commentCorrection?.some((c) => c.type === "Preprint of");
  const title = strip(r.title ?? "");
  const abstract = strip(r.abstractText ?? "");
  if (published || !title || !abstract) return null;

  const listed = (r.authorList?.author ?? [])
    .filter((a) => a.lastName)
    .map((a) => [a.lastName, a.initials].filter(Boolean).join(" "));
  const authors = listed.length > 0
    ? listed
    : (r.authorString ?? "").replace(/\.$/, "").split(/,\s*/).filter(Boolean);
  const doi = r.doi?.trim() || null;
  return {
    pmid: r.id, title, authors: authors.slice(0, 7).join("; "), journal: "medRxiv",
    year: Number(r.firstPublicationDate?.slice(0, 4)) || null,
    volume: null, issue: null, pages: null, pmcid: null, doi,
    publicationTypes: ["Preprint"], abstract,
    url: doi ? `https://doi.org/${doi}` : `https://europepmc.org/article/PPR/${r.id}`,
    evidenceLevel: "low", evidenceLabel: "Preprint", retracted: false,
  };
}

const MAX_PREPRINTS = 2;

/** Até 2 preprints no fim da lista; os artigos revisados abrem espaço só o necessário. */
export function withPreprints<T extends { pmid: string }>(articles: T[], preprints: T[], max: number): T[] {
  const extra = preprints.slice(0, MAX_PREPRINTS);
  return [...articles.slice(0, max - extra.length), ...extra];
}
