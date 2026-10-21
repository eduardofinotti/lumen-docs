import { describe, expect, test } from "vitest";
import { parseConclusion, parseFeedback, parseSummary, sourceRowToArticle, type SourceRow } from "./guards";

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
  retracted: false,
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

  test("diretriz brasileira tem etiqueta própria", () => {
    expect(sourceRowToArticle({ ...row, evidence_label: "Diretriz brasileira" }).evidence).toBe("diretriz-brasileira");
    expect(sourceRowToArticle({ ...row, evidence_label: "Diretriz" }).evidence).toBe("diretriz");
  });
});

describe("artigo retratado", () => {
  test("marca o artigo retratado", () => {
    expect(sourceRowToArticle({ ...row, retracted: true }).retracted).toBe(true);
  });

  test("coluna ausente ou falsa: não retratado", () => {
    expect(sourceRowToArticle({ ...row, retracted: null }).retracted).toBe(false);
  });
});

describe("parseSummary: amostra", () => {
  const base = "Pergunta: p.\nMétodo: m.\nResultado: r.\nLimitação: l.";

  test("lê a amostra em algarismos, com ou sem ponto de milhar", () => {
    expect(parseSummary(`${base}\nAmostra: 3234`)?.amostra).toBe(3234);
    expect(parseSummary(`${base}\nAmostra: 3.234 participantes`)?.amostra).toBe(3234);
  });

  test("amostra não informada, ausente (resumo antigo) ou sem número fica de fora", () => {
    expect(parseSummary(`${base}\nAmostra: Não informada`)?.amostra).toBeUndefined();
    expect(parseSummary(base)?.amostra).toBeUndefined();
    expect(parseSummary(base)?.pergunta).toBe("p.");
    expect(parseSummary(`${base}\nAmostra: 0`)?.amostra).toBeUndefined();
  });

  test("número com casas decimais ou intervalo não vira amostra", () => {
    expect(parseSummary(`${base}\nAmostra: 12 a 40 por estudo`)?.amostra).toBeUndefined();
  });
});

describe("parseConclusion", () => {
  test("conclusão com força e motivo", () => {
    expect(parseConclusion("Reduz eventos [1].", "alta", "2 metanálises")).toEqual({
      text: "Reduz eventos [1].",
      strength: "alta",
      reason: "2 metanálises",
    });
  });

  test("sem texto (resposta antiga): sem bloco", () => {
    expect(parseConclusion(null, null, null)).toBeNull();
  });

  test("força desconhecida vira null, o texto fica", () => {
    expect(parseConclusion("Algo.", "altíssima", null)).toEqual({ text: "Algo.", strength: null, reason: null });
  });
});

describe("parseFeedback", () => {
  test("voto sim e não com motivo", () => {
    expect(parseFeedback({ helpful: true, reason: null })).toEqual({ helpful: true, reason: null });
    expect(parseFeedback({ helpful: false, reason: "confusa" })).toEqual({ helpful: false, reason: "confusa" });
  });

  test("motivo desconhecido é descartado; sem voto, null", () => {
    expect(parseFeedback({ helpful: false, reason: "xyz" })).toEqual({ helpful: false, reason: null });
    expect(parseFeedback(undefined)).toBeNull();
  });
});
