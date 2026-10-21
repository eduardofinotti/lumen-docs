import { describe, expect, test } from "vitest";
import { brazilianGuidelineQuery, guidelineDays, isBrazilianGuideline, mergeWithGuidelines } from "./guidelines.ts";

describe("brazilianGuidelineQuery", () => {
  test("restringe a busca do tema a diretrizes de revistas e sociedades brasileiras", () => {
    const q = brazilianGuidelineQuery('"Heart Failure"[MeSH Terms]');
    expect(q.startsWith('("Heart Failure"[MeSH Terms]) AND (')).toBe(true);
    expect(q).toContain('Guideline[pt]');
    expect(q).toContain('"Arq Bras Cardiol"[ta]');
    expect(q).toContain('"Sociedade Brasileira"[ad]');
  });
});

describe("guidelineDays", () => {
  test("segue o filtro do médico e limita 'qualquer data' a 10 anos", () => {
    expect(guidelineDays("1y")).toBe(365);
    expect(guidelineDays("5y")).toBe(1826);
    expect(guidelineDays("all")).toBe(3652);
  });
});

describe("isBrazilianGuideline", () => {
  const base = { publicationTypes: ["Journal Article"], title: "", journal: "" };

  test("diretriz de sociedade publicada em revista brasileira", () => {
    expect(isBrazilianGuideline({ ...base, title: "Diretriz Brasileira de Insuficiência Cardíaca Crônica e Aguda.", journal: "Arq Bras Cardiol" })).toBe(true);
    expect(isBrazilianGuideline({ ...base, title: "Position Statement on Antithrombotic Therapy in Dengue - 2026.", journal: "Arq Bras Cardiol" })).toBe(true);
    expect(isBrazilianGuideline({ publicationTypes: ["Practice Guideline"], title: "[Drug therapy].", journal: "J Bras Nefrol" })).toBe(true);
  });

  test("em revista de fora, precisa do tipo diretriz e de Brasil no título", () => {
    expect(isBrazilianGuideline({ publicationTypes: ["Practice Guideline"], title: "Brazilian guidelines for the management of psoriasis", journal: "J Dermatol" })).toBe(true);
    expect(isBrazilianGuideline({ ...base, title: "Direct costs of dengue in Brazil and adherence to WHO guidelines", journal: "PLoS Negl Trop Dis" })).toBe(false);
    expect(isBrazilianGuideline({ ...base, title: "Brazilian recommendations for psoriasis", journal: "J Dermatol" })).toBe(false);
  });

  test("consenso em revista brasileira", () => {
    expect(isBrazilianGuideline({ publicationTypes: ["Consensus Statement", "Journal Article"], title: "[Mechanical ventilation in acute asthma crisis].", journal: "J Bras Pneumol" })).toBe(true);
  });

  test("diretriz internacional, mesmo com coautor brasileiro, não conta", () => {
    expect(isBrazilianGuideline({ publicationTypes: ["Consensus Statement"], title: "AHA/ACC/ESC Expert Consensus Document", journal: "Eur Heart J" })).toBe(false);
  });

  test("artigo brasileiro que não é diretriz não conta", () => {
    expect(isBrazilianGuideline({ ...base, title: "Direct costs of dengue hospitalization in Brazil", journal: "PLoS Negl Trop Dis" })).toBe(false);
    expect(isBrazilianGuideline({ publicationTypes: ["Randomized Controlled Trial"], title: "Semaglutide in obese adults", journal: "Arq Bras Cardiol" })).toBe(false);
  });

  test("revisão ou avaliação sobre diretrizes não é diretriz", () => {
    expect(isBrazilianGuideline({ publicationTypes: ["Journal Article", "Review"], title: "Diagnosis of asthma in childhood: an overview of guidelines.", journal: "J Bras Pneumol" })).toBe(false);
    expect(isBrazilianGuideline({ ...base, title: "Clinical Practice Guidelines in Brazil: A Systematic Assessment of Methodological Quality", journal: "PLoS One" })).toBe(false);
  });
});

describe("mergeWithGuidelines", () => {
  const a = (pmid: string) => ({ pmid });

  test("diretrizes primeiro (até 3), depois os demais sem repetir, até o limite", () => {
    const merged = mergeWithGuidelines([a("g1"), a("g2"), a("g3"), a("g4")], [a("x1"), a("g1"), a("x2"), a("x3")], 5);
    expect(merged.map((x) => x.pmid)).toEqual(["g1", "g2", "g3", "x1", "x2"]);
  });

  test("sem diretrizes, a lista geral fica igual", () => {
    expect(mergeWithGuidelines([], [a("x1"), a("x2")], 12).map((x) => x.pmid)).toEqual(["x1", "x2"]);
  });
});
