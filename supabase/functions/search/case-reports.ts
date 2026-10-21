// Lúmen · relatos de caso de uma resposta (funções puras, testadas com vitest)
// Lista para consulta, sem nova síntese: relato de caso descreve um paciente, não sustenta conclusão.

/** A busca do tema restrita a relatos de caso. */
export function caseReportQuery(topicQuery: string): string {
  return `(${topicQuery}) AND "Case Reports"[pt]`;
}

/** Busca do tema da resposta; a que reaproveitou artigos usa a última busca antes dela. */
export function topicQueryFor(position: number, turns: { position: number; pubmed_query: string | null }[]): string | null {
  const withQuery = turns
    .filter((t) => t.position <= position && t.pubmed_query)
    .sort((a, b) => b.position - a.position);
  return withQuery[0]?.pubmed_query ?? null;
}
