import { describe, expect, test } from "vitest";
import { mockResults } from "@/lib/mocks/results";
import type { Article } from "@/types/article";
import type { Turn } from "@/types/search";
import { showNoGuidelineNotice } from "./guidelines";

const article = mockResults.metformina.sources[0];
const turn: Turn = {
  id: "t1",
  position: 1,
  question: "Colecistectomia na pancreatite biliar leve?",
  standaloneQuestion: null,
  status: "done",
  answerMd: "Texto [1].",
  conclusion: null,
  sources: [article],
  guidelinesSearched: true,
  caseReports: null,
  feedback: null,
  createdAt: "2026-10-21T12:00:00Z",
};

describe("showNoGuidelineNotice", () => {
  test("procuramos diretrizes brasileiras e nenhuma veio: mostra o aviso", () => {
    expect(showNoGuidelineNotice(turn)).toBe(true);
  });

  test("com diretriz brasileira entre os artigos, não mostra", () => {
    const guideline: Article = { ...article, pmid: "42233838", evidence: "diretriz-brasileira" };
    expect(showNoGuidelineNotice({ ...turn, sources: [guideline, article] })).toBe(false);
  });

  test("resposta antiga, que reaproveitou artigos ou cuja busca de diretrizes falhou: não mostra", () => {
    expect(showNoGuidelineNotice({ ...turn, guidelinesSearched: false })).toBe(false);
  });

  test("sem artigos ou resposta que não terminou: não mostra", () => {
    expect(showNoGuidelineNotice({ ...turn, sources: [] })).toBe(false);
    expect(showNoGuidelineNotice({ ...turn, status: "error" })).toBe(false);
  });
});
