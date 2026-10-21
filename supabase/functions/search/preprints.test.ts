import { describe, expect, test } from "vitest";
import { parsePreprint, preprintDays, toEuropePmcQuery, withPreprints, type EuropePmcRecord } from "./preprints.ts";

describe("toEuropePmcQuery", () => {
  const today = new Date("2026-10-21T12:00:00Z");

  test("troca os campos do PubMed por título e resumo, tira o filtro de humanos e limita ao medRxiv", () => {
    const q = toEuropePmcQuery(
      '("Glucagon-Like Peptide-1 Receptor Agonists"[MeSH Terms] OR semaglutide[Title/Abstract] OR "GLP-1 receptor agonist*"[Title/Abstract]) AND humans[MeSH Terms]',
      365,
      today,
    );
    expect(q).toBe(
      '(TITLE_ABS:"Glucagon-Like Peptide-1 Receptor Agonists" OR TITLE_ABS:semaglutide OR TITLE_ABS:"GLP-1 receptor agonist*")' +
        ' AND SRC:PPR AND PUBLISHER:"medRxiv" AND FIRST_PDATE:[2025-10-21 TO 2026-10-21]',
    );
  });

  test("aceita as abreviações [tiab] e [mh] e descarta outros campos", () => {
    const q = toEuropePmcQuery('dengue[tiab] AND "Anticoagulants"[mh] AND Guideline[pt]', 1826, today);
    expect(q.startsWith('TITLE_ABS:dengue AND TITLE_ABS:"Anticoagulants" AND Guideline AND SRC:PPR')).toBe(true);
    expect(q).toContain("FIRST_PDATE:[2021-10-21 TO 2026-10-21]");
  });
});

describe("preprintDays", () => {
  test("segue o filtro do médico; 'qualquer data' fica em 5 anos (preprint antigo e não publicado é sinal ruim)", () => {
    expect(preprintDays("1y")).toBe(365);
    expect(preprintDays("5y")).toBe(1826);
    expect(preprintDays("all")).toBe(1826);
  });
});

describe("parsePreprint", () => {
  const record: EuropePmcRecord = {
    id: "PPR1030829",
    source: "PPR",
    doi: "10.1101/2025.06.01.25328745",
    title: "Real-world outcomes of semaglutide in CKD.",
    authorList: { author: [{ lastName: "Silva", initials: "JP" }, { lastName: "Costa", initials: "A" }] },
    firstPublicationDate: "2025-06-04",
    abstractText: "<h4>Background</h4>GLP-1 RA &amp; CKD. <b>Results</b> fewer events.",
    bookOrReportDetails: { publisher: "medRxiv" },
  };

  test("vira artigo com etiqueta de preprint, link do medRxiv e resumo sem HTML", () => {
    expect(parsePreprint(record)).toEqual({
      pmid: "PPR1030829",
      title: "Real-world outcomes of semaglutide in CKD.",
      authors: "Silva JP; Costa A",
      journal: "medRxiv",
      year: 2025,
      volume: null,
      issue: null,
      pages: null,
      pmcid: null,
      doi: "10.1101/2025.06.01.25328745",
      publicationTypes: ["Preprint"],
      abstract: "Background GLP-1 RA & CKD. Results fewer events.",
      url: "https://doi.org/10.1101/2025.06.01.25328745",
      evidenceLevel: "low",
      evidenceLabel: "Preprint",
      retracted: false,
    });
  });

  test("sem lista de autores, usa o authorString", () => {
    const { authorList: _, ...rest } = record;
    expect(parsePreprint({ ...rest, authorString: "Chiang P, Chen SC, Hung P." })?.authors).toBe("Chiang P; Chen SC; Hung P");
  });

  test("preprint já publicado em revista fica de fora (a versão revisada está no PubMed)", () => {
    const published = { ...record, commentCorrectionList: { commentCorrection: [{ type: "Preprint of", id: "41956884", source: "MED" }] } };
    expect(parsePreprint(published)).toBeNull();
  });

  test("sem resumo ou sem título fica de fora", () => {
    expect(parsePreprint({ ...record, abstractText: "" })).toBeNull();
    expect(parsePreprint({ ...record, title: "" })).toBeNull();
  });

  test("sem DOI, o link vai para a página do Europe PMC", () => {
    expect(parsePreprint({ ...record, doi: undefined })?.url).toBe("https://europepmc.org/article/PPR/PPR1030829");
  });
});

describe("withPreprints", () => {
  const a = (pmid: string) => ({ pmid });

  test("até 2 preprints no fim, sem passar do limite", () => {
    const list = ["1", "2", "3", "4", "5"].map(a);
    expect(withPreprints(list, [a("P1"), a("P2"), a("P3")], 5).map((x) => x.pmid)).toEqual(["1", "2", "3", "P1", "P2"]);
  });

  test("lista curta: preprints só se somam", () => {
    expect(withPreprints([a("1")], [a("P1")], 12).map((x) => x.pmid)).toEqual(["1", "P1"]);
  });

  test("sem preprints, a lista fica igual", () => {
    expect(withPreprints([a("1"), a("2")], [], 12).map((x) => x.pmid)).toEqual(["1", "2"]);
  });
});
