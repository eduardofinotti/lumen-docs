import { describe, expect, test } from "vitest";
import { dictationError, joinDictation } from "./dictation";

describe("joinDictation", () => {
  test("caixa vazia recebe só o que foi falado, com a primeira letra maiúscula", () => {
    expect(joinDictation("", "metformina previne diabetes")).toBe("Metformina previne diabetes");
  });

  test("acrescenta ao texto já digitado com um espaço", () => {
    expect(joinDictation("Em idosos,", "a metformina previne")).toBe("Em idosos, a metformina previne");
    expect(joinDictation("Em idosos ", "a metformina")).toBe("Em idosos a metformina");
  });

  test("depois de ponto final, começa com maiúscula", () => {
    expect(joinDictation("Tenho dúvida.", "e na gestante")).toBe("Tenho dúvida. E na gestante");
  });

  test("nada falado: mantém o texto", () => {
    expect(joinDictation("Pergunta", "  ")).toBe("Pergunta");
  });
});

describe("dictationError", () => {
  test("microfone bloqueado explica como liberar", () => {
    expect(dictationError("not-allowed")).toMatch(/Permita o uso do microfone/);
    expect(dictationError("service-not-allowed")).toMatch(/Permita o uso do microfone/);
  });

  test("cancelamento não mostra erro; silêncio pede para falar de novo", () => {
    expect(dictationError("no-speech")).toMatch(/Não ouvimos nada/);
    expect(dictationError("aborted")).toBeNull();
  });

  test("sem internet e erro desconhecido", () => {
    expect(dictationError("network")).toMatch(/internet/);
    expect(dictationError("qualquer")).toMatch(/Não foi possível ditar/);
  });
});
