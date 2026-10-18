import { describe, expect, test } from "vitest";
import { buildHistory, isStalePending, parseRouterReply, selectReuseArticles, type HistoryTurn } from "./conversation.ts";

const grave = "A colecistectomia na mesma internação reduz recorrência na pancreatite biliar grave?";

describe("parseRouterReply", () => {
  test("lê JSON válido", () => {
    expect(
      parseRouterReply(
        `{"action":"search","standaloneQuestion":"${grave}","pubmedQuery":"cholecystectomy AND severe"}`,
        "e na grave?",
      ),
    ).toEqual({ action: "search", standaloneQuestion: grave, pubmedQuery: "cholecystectomy AND severe" });
  });

  test("aceita JSON dentro de cerca ```json", () => {
    const text = "```json\n" + `{"action":"reuse","standaloneQuestion":"${grave}","pubmedQuery":null}` + "\n```";
    expect(parseRouterReply(text, "e na grave?")).toEqual({ action: "reuse", standaloneQuestion: grave, pubmedQuery: null });
  });

  test("cai para search com a pergunta original quando não é JSON", () => {
    expect(parseRouterReply("não sei", "e na grave?")).toEqual({
      action: "search",
      standaloneQuestion: "e na grave?",
      pubmedQuery: null,
    });
  });

  test("trata action desconhecida como search", () => {
    expect(parseRouterReply(`{"action":"talvez","standaloneQuestion":"${grave}"}`, "e na grave?")).toEqual({
      action: "search",
      standaloneQuestion: grave,
      pubmedQuery: null,
    });
  });

  test("reuse ignora pubmedQuery", () => {
    expect(
      parseRouterReply(`{"action":"reuse","standaloneQuestion":"${grave}","pubmedQuery":"x"}`, "e na grave?").pubmedQuery,
    ).toBeNull();
  });

  test("standaloneQuestion vazia usa a pergunta original", () => {
    expect(parseRouterReply(`{"action":"search","standaloneQuestion":"  "}`, "e na grave?").standaloneQuestion).toBe(
      "e na grave?",
    );
  });
});

describe("buildHistory", () => {
  const turn = (i: number, answer = `Resposta ${i}.`): HistoryTurn => ({
    question: `pergunta ${i}`,
    standaloneQuestion: i === 1 ? null : `pergunta completa ${i}`,
    answerMd: answer,
  });

  test("guarda só os 6 últimos turnos", () => {
    const history = buildHistory(Array.from({ length: 8 }, (_, i) => turn(i + 1)));
    expect(history).not.toContain("pergunta 2");
    expect(history).toContain("pergunta completa 3");
    expect(history).toContain("Resposta 8.");
  });

  test("corta resposta em 1500 caracteres e tira [n] e a nota final", () => {
    const long = "Achado [1] [2]. " + "x".repeat(2000) + "\n\nA decisão clínica é do médico.";
    const history = buildHistory([turn(1, long)]);
    expect(history).not.toMatch(/\[\d+\]/);
    expect(history).not.toContain("A decisão clínica é do médico.");
    expect(history).toContain("…");
    expect(history.length).toBeLessThan(1700);
  });

  test("usa a pergunta original na primeira e a completa nas seguintes", () => {
    const history = buildHistory([turn(1), turn(2)]);
    expect(history).toContain("pergunta 1");
    expect(history).toContain("pergunta completa 2");
  });
});

describe("selectReuseArticles", () => {
  test("prioriza citados, sem repetir PMID, máximo 12", () => {
    const known = [
      { pmid: "1", cited: false, turnPosition: 1 },
      { pmid: "2", cited: true, turnPosition: 1 },
      { pmid: "3", cited: false, turnPosition: 2 },
      { pmid: "2", cited: true, turnPosition: 2 },
      ...Array.from({ length: 15 }, (_, i) => ({ pmid: `n${i}`, cited: false, turnPosition: 1 })),
    ];
    const result = selectReuseArticles(known);
    expect(result[0]).toBe("2");
    expect(result[1]).toBe("3"); // depois dos citados, o turno mais recente
    expect(new Set(result).size).toBe(result.length);
    expect(result).toHaveLength(12);
  });
});

describe("isStalePending", () => {
  const now = new Date("2026-10-18T12:00:00Z");
  test("pending com mais de 5 minutos está travado", () => {
    expect(isStalePending("pending", "2026-10-18T11:54:00Z", now)).toBe(true);
  });
  test("pending recente ainda está em andamento", () => {
    expect(isStalePending("pending", "2026-10-18T11:58:00Z", now)).toBe(false);
  });
  test("outros status nunca estão travados", () => {
    expect(isStalePending("done", "2026-10-18T10:00:00Z", now)).toBe(false);
  });
});
