import { describe, expect, test } from "vitest";
import { isRetracted, splitConclusion } from "./answer.ts";

describe("splitConclusion", () => {
  const body = "A metformina reduziu eventos [1].\n\n**Lacunas:** sem dados em idosos.\n\nA decisão clínica é do médico.";

  test("separa a conclusão, a força e o motivo do resto da resposta", () => {
    const text = `Em resumo: a metformina reduziu eventos cardiovasculares [1].\nForça da evidência: Alta — 2 metanálises concordantes\n\n${body}`;
    expect(splitConclusion(text)).toEqual({
      conclusion: "a metformina reduziu eventos cardiovasculares [1].",
      strength: "alta",
      reason: "2 metanálises concordantes",
      body,
    });
  });

  test("aceita negrito, hífen no lugar do travessão e acento faltando", () => {
    const text = `**Em resumo:** pouca evidência.\n**Forca da evidencia:** Moderada - 1 ECR\n\n${body}`;
    const r = splitConclusion(text);
    expect(r.strength).toBe("moderada");
    expect(r.reason).toBe("1 ECR");
    expect(r.conclusion).toBe("pouca evidência.");
    expect(r.body).toBe(body);
  });

  test("força sem motivo", () => {
    expect(splitConclusion(`Em resumo: nada.\nForça da evidência: Insuficiente\n\n${body}`)).toMatchObject({
      strength: "insuficiente",
      reason: null,
    });
  });

  test("sem o bloco, devolve a resposta inteira e nada de conclusão", () => {
    expect(splitConclusion(body)).toEqual({ conclusion: null, strength: null, reason: null, body });
  });

  test("força fora da escala: guarda a conclusão e descarta a força", () => {
    const r = splitConclusion(`Em resumo: algo.\nForça da evidência: Muito alta\n\n${body}`);
    expect(r).toEqual({ conclusion: "algo.", strength: null, reason: null, body });
  });
});

describe("isRetracted", () => {
  test("tipo de publicação Retracted Publication", () => {
    expect(isRetracted(`<PublicationType UI="D016441">Retracted Publication</PublicationType>`)).toBe(true);
  });

  test("aviso de retratação nas correções do artigo", () => {
    expect(isRetracted(`<CommentsCorrections RefType="RetractionIn"><RefSource>Lancet. 2020</RefSource></CommentsCorrections>`)).toBe(true);
  });

  test("artigo comum, ou o próprio aviso de retratação, não conta", () => {
    expect(isRetracted(`<PublicationType>Randomized Controlled Trial</PublicationType>`)).toBe(false);
    expect(isRetracted(`<PublicationType>Retraction of Publication</PublicationType><CommentsCorrections RefType="RetractionOf">`)).toBe(false);
  });
});
