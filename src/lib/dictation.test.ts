import { describe, expect, test } from "vitest";
import { barLevels, dictationError, joinDictation, shouldKeepListening } from "./dictation";

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

  test("junta os pedaços sem espaços repetidos", () => {
    expect(joinDictation("", " posso usar  atosiban ")).toBe("Posso usar atosiban");
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

describe("shouldKeepListening", () => {
  test("o navegador parou sozinho (pausa na fala): religa enquanto o médico não tocar em parar", () => {
    expect(shouldKeepListening({ wanted: true, lastError: null, quickEnds: 0 })).toBe(true);
    expect(shouldKeepListening({ wanted: true, lastError: "no-speech", quickEnds: 0 })).toBe(true);
  });

  test("o médico tocou em parar: não religa", () => {
    expect(shouldKeepListening({ wanted: false, lastError: null, quickEnds: 0 })).toBe(false);
  });

  test("microfone bloqueado ou sem internet: não religa", () => {
    expect(shouldKeepListening({ wanted: true, lastError: "not-allowed", quickEnds: 0 })).toBe(false);
    expect(shouldKeepListening({ wanted: true, lastError: "network", quickEnds: 0 })).toBe(false);
  });

  test("encerrou logo ao começar várias vezes seguidas: desiste para não ficar em laço", () => {
    expect(shouldKeepListening({ wanted: true, lastError: null, quickEnds: 3 })).toBe(false);
  });
});

describe("barLevels", () => {
  test("silêncio: barras no mínimo", () => {
    expect(barLevels(new Uint8Array(64).fill(0), 5)).toEqual([0.15, 0.15, 0.15, 0.15, 0.15]);
  });

  test("som alto: barras cheias, entre 0,15 e 1", () => {
    const levels = barLevels(new Uint8Array(64).fill(255), 5);
    expect(levels).toHaveLength(5);
    levels.forEach((l) => expect(l).toBe(1));
  });

  test("cada barra reflete a sua faixa de frequência", () => {
    const data = new Uint8Array(40);
    data.fill(200, 0, 4);
    const [first, second] = barLevels(data, 5);
    expect(first).toBeGreaterThan(second);
  });
});
