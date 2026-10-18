import { describe, expect, test } from "vitest";
import { fullTextUrl } from "./article-links";

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
