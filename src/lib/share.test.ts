import { describe, expect, test } from "vitest";
import { mockResults } from "@/lib/mocks/results";
import type { Turn } from "@/types/search";
import { buildShareText, shareTarget } from "./share";
import { buildCopyText } from "./vancouver";

const turn: Turn = {
  id: "t1",
  position: 1,
  question: "Metformina previne diabetes?",
  standaloneQuestion: null,
  status: "done",
  answerMd: "A metformina **reduziu** a incidência [1].",
  conclusion: { text: "Reduz a progressão [1].", strength: "alta", reason: "2 ECRs" },
  sources: mockResults.metformina.sources.slice(0, 1),
  feedback: null,
  createdAt: "2026-10-20T12:00:00Z",
};

describe("buildCopyText", () => {
  test("traz a conclusão e a força da evidência antes da resposta", () => {
    const text = buildCopyText("Metformina previne diabetes?", turn);
    expect(text).toContain("Em resumo: Reduz a progressão [1].\nForça da evidência: Alta (2 ECRs)");
    expect(text.indexOf("Em resumo")).toBeLessThan(text.indexOf("A metformina reduziu"));
  });

  test("resposta antiga, sem conclusão, fica como antes", () => {
    const text = buildCopyText("Metformina previne diabetes?", { ...turn, conclusion: null });
    expect(text).not.toContain("Em resumo");
    expect(text.startsWith("Pergunta: Metformina previne diabetes?\n\nA metformina reduziu")).toBe(true);
  });
});

describe("buildShareText", () => {
  const text = buildShareText("Metformina previne diabetes?", turn, "https://lumen.exemplo");

  test("usa o negrito do WhatsApp e mantém as citações", () => {
    expect(text.startsWith("*Pergunta:* Metformina previne diabetes?")).toBe(true);
    expect(text).toContain("*Em resumo:* Reduz a progressão [1].");
    expect(text).toContain("*Força da evidência:* Alta (2 ECRs)");
    expect(text).toContain("A metformina *reduziu* a incidência [1].");
  });

  test("traz referências, a nota clínica e termina com o Lúmen", () => {
    expect(text).toContain("*Referências*\n1. Knowler WC");
    expect(text).toContain("A decisão clínica é do médico.");
    expect(text.endsWith("Pesquisado no Lúmen: https://lumen.exemplo")).toBe(true);
  });

  test("artigo retratado é avisado na referência", () => {
    const retracted = { ...turn, sources: [{ ...turn.sources[0], retracted: true }] };
    expect(buildShareText("x", retracted, "https://l")).toContain("PMID: 11832527. (Artigo retratado)");
  });
});

describe("shareTarget", () => {
  test("celular com menu de compartilhar usa o menu do aparelho", () => {
    expect(shareTarget({ canShare: true, touch: true })).toBe("sistema");
  });

  test("computador, ou celular sem o menu, abre o WhatsApp", () => {
    expect(shareTarget({ canShare: true, touch: false })).toBe("whatsapp");
    expect(shareTarget({ canShare: false, touch: true })).toBe("whatsapp");
  });
});
