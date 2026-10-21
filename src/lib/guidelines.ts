import type { Turn } from "@/types/search";

/** A busca procurou diretrizes brasileiras e nenhuma entrou nos artigos: o médico fica sabendo. */
export function showNoGuidelineNotice(turn: Turn): boolean {
  return turn.status === "done" && turn.guidelinesSearched && turn.sources.length > 0 &&
    !turn.sources.some((a) => a.evidence === "diretriz-brasileira");
}
