import { describe, expect, test } from "vitest";
import { mockResults } from "@/lib/mocks/results";
import { formatVancouver } from "./vancouver";

const article = mockResults.metformina.sources[0];

describe("formatVancouver", () => {
  test("monta a referência com 6 autores, et al. e localizador completo", () => {
    expect(formatVancouver(article)).toBe(
      "Knowler WC, Barrett-Connor E, Fowler SE, Hamman RF, Lachin JM, Walker EA, et al. Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin. N Engl J Med. 2002;346(6):393-403. PMID: 11832527.",
    );
  });

  test("sem ano nem volume, omite o localizador", () => {
    expect(formatVancouver({ ...article, year: null, volume: undefined })).toBe(
      "Knowler WC, Barrett-Connor E, Fowler SE, Hamman RF, Lachin JM, Walker EA, et al. Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin. N Engl J Med. PMID: 11832527.",
    );
  });

  test("preprint: marca [Preprint], medRxiv, ano e DOI no lugar do PMID", () => {
    const preprint = { ...article, pmid: "PPR1030829", authors: ["Silva JP", "Costa A"], title: "Semaglutide in CKD.",
      journal: "medRxiv", year: 2025, volume: undefined, issue: undefined, pages: undefined, doi: "10.1101/2025.06.03.25328908",
      source: "medRxiv" as const, evidence: "preprint" as const };
    expect(formatVancouver(preprint)).toBe("Silva JP, Costa A. Semaglutide in CKD. medRxiv [Preprint]. 2025. doi: 10.1101/2025.06.03.25328908.");
  });
});
