import { describe, expect, test } from "vitest";
import { caseReportQuery, topicQueryFor } from "./case-reports.ts";

describe("caseReportQuery", () => {
  test("restringe a busca do tema a relatos de caso", () => {
    expect(caseReportQuery('("Dengue"[MeSH Terms] OR dengue[Title/Abstract]) AND humans[MeSH Terms]')).toBe(
      '(("Dengue"[MeSH Terms] OR dengue[Title/Abstract]) AND humans[MeSH Terms]) AND "Case Reports"[pt]',
    );
  });
});

describe("topicQueryFor", () => {
  const turns = [
    { position: 1, pubmed_query: "q1" },
    { position: 2, pubmed_query: null },
    { position: 3, pubmed_query: "q3" },
    { position: 4, pubmed_query: null },
  ];

  test("usa a busca da própria resposta", () => {
    expect(topicQueryFor(3, turns)).toBe("q3");
  });

  test("resposta que reaproveitou artigos usa a última busca antes dela", () => {
    expect(topicQueryFor(2, turns)).toBe("q1");
    expect(topicQueryFor(4, turns)).toBe("q3");
  });

  test("sem nenhuma busca antes, não há tema", () => {
    expect(topicQueryFor(1, [{ position: 1, pubmed_query: null }])).toBeNull();
  });
});
