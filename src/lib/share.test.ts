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
  guidelinesSearched: false,
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

  test("traz a referência curta com link, a nota clínica e termina com o Lúmen", () => {
    const a = turn.sources[0];
    expect(text).toContain(`[1] ${a.title.replace(/\.$/, "")}. ${a.journal} ${a.year}. https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`);
    expect(text).toContain("A decisão clínica é do médico.");
    expect(text.endsWith("Pesquisado no Lúmen: https://lumen.exemplo")).toBe(true);
  });

  test("artigo retratado é avisado na referência", () => {
    const retracted = { ...turn, sources: [{ ...turn.sources[0], retracted: true }] };
    expect(buildShareText("x", retracted, "https://l")).toContain(`${turn.sources[0].pmid}/ (artigo retratado)`);
  });

  // Texto longo demais faz o WhatsApp Web descartar a mensagem e mandar só o link.
  describe("resposta longa", () => {
    const base = turn.sources[0];
    const sources = Array.from({ length: 12 }, (_, i) => ({ ...base, pmid: String(1000 + i), title: `Estudo ${i + 1} ${"palavra ".repeat(20)}` }));
    const long: Turn = {
      ...turn,
      conclusion: { text: "Reduz eventos [1].", strength: "alta", reason: "2 ECRs" },
      answerMd: `Abertura com a resposta direta [2]. ${"Frase de abertura. ".repeat(10)}\n\nAchados detalhados [3] [4]. ${"Mais detalhe. ".repeat(80)}\n\n**Lacunas:** muitas.`,
      sources,
    };
    const shared = buildShareText("Pergunta", long, "https://lumen.exemplo");

    test("fica curto o bastante para o WhatsApp", () => {
      expect(shared.length).toBeLessThanOrEqual(1500);
    });

    test("leva só o primeiro parágrafo da resposta", () => {
      expect(shared).toContain("Abertura com a resposta direta [2].");
      expect(shared).not.toContain("Achados detalhados");
    });

    test("lista só os artigos citados no resumo e no primeiro parágrafo", () => {
      expect(shared).toContain("[1] Estudo 1 ");
      expect(shared).toContain("[2] Estudo 2 ");
      expect(shared).not.toContain("[3] Estudo 3");
    });
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
