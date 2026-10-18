import { describe, expect, test } from "vitest";
import { sourceRowToArticle, type SourceRow } from "./guards";

const row: SourceRow = {
  position: 1,
  pmid: "11832527",
  title: "Reduction in the incidence of type 2 diabetes",
  authors: "Knowler WC; Barrett-Connor E",
  journal: "N Engl J Med",
  year: 2002,
  volume: "346",
  issue: "6",
  pages: "393-403",
  pmcid: "PMC1370926",
  doi: "10.1056/NEJMoa012512",
  evidence_label: "Ensaio clínico randomizado",
  summary_pt: null,
};

describe("sourceRowToArticle", () => {
  test("lê PMCID e DOI", () => {
    const article = sourceRowToArticle(row);
    expect(article.pmcid).toBe("PMC1370926");
    expect(article.doi).toBe("10.1056/NEJMoa012512");
  });

  test("PMCID e DOI nulos viram undefined", () => {
    const article = sourceRowToArticle({ ...row, pmcid: null, doi: null });
    expect(article.pmcid).toBeUndefined();
    expect(article.doi).toBeUndefined();
  });
});
