import { describe, expect, test } from "vitest";
import { articleUrl, fullTextUrl, isPreprint } from "./article-links";

describe("fullTextUrl", () => {
  test("com PMCID, leva ao texto completo no PubMed Central", () => {
    expect(fullTextUrl({ pmid: "11832527", pmcid: "PMC1370926", doi: "10.1056/NEJMoa012512" })).toEqual({
      href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1370926/",
      label: "PubMed Central",
    });
  });

  test("sem PMCID e com DOI, leva à revista", () => {
    expect(fullTextUrl({ pmid: "11832527", doi: "10.1056/NEJMoa012512" })).toEqual({
      href: "https://doi.org/10.1056/NEJMoa012512",
      label: "Revista",
    });
  });

  test("sem os dois, leva ao PubMed", () => {
    expect(fullTextUrl({ pmid: "11832527" })).toEqual({
      href: "https://pubmed.ncbi.nlm.nih.gov/11832527/",
      label: "PubMed",
    });
  });
});

describe("preprint do medRxiv", () => {
  test("reconhece pelo identificador do Europe PMC", () => {
    expect(isPreprint({ pmid: "PPR1030829" })).toBe(true);
    expect(isPreprint({ pmid: "11832527" })).toBe(false);
  });

  test("o texto completo é o próprio medRxiv, pelo DOI", () => {
    expect(fullTextUrl({ pmid: "PPR1030829", doi: "10.1101/2025.06.03.25328908" })).toEqual({
      href: "https://doi.org/10.1101/2025.06.03.25328908",
      label: "medRxiv",
    });
  });

  test("sem DOI, a página do Europe PMC", () => {
    expect(fullTextUrl({ pmid: "PPR1030829" })).toEqual({ href: "https://europepmc.org/article/PPR/PPR1030829", label: "medRxiv" });
  });
});

describe("articleUrl", () => {
  test("artigo do PubMed vai para o PubMed; preprint, para o medRxiv", () => {
    expect(articleUrl({ pmid: "11832527", doi: "10.1056/NEJMoa012512" })).toBe("https://pubmed.ncbi.nlm.nih.gov/11832527/");
    expect(articleUrl({ pmid: "PPR1030829", doi: "10.1101/2025.06.03.25328908" })).toBe("https://doi.org/10.1101/2025.06.03.25328908");
  });
});
