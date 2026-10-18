import { describe, expect, test } from "vitest";
import { validateQuestion } from "./question";

const SHORT = "Escreva a pergunta com um pouco mais de detalhe.";

describe("validateQuestion", () => {
  test("continuação curta é válida", () => {
    expect(validateQuestion("e na grave?", { followUp: true })).toBeNull();
  });

  test("primeira pergunta mantém o mínimo de 10 caracteres", () => {
    expect(validateQuestion("e na grave?", { followUp: false })).toBeNull();
    expect(validateQuestion("e grave?", { followUp: false })).toBe(SHORT);
  });

  test("continuação com menos de 3 caracteres é recusada", () => {
    expect(validateQuestion("ok", { followUp: true })).toBe(SHORT);
  });

  test("CPF bloqueia também a continuação", () => {
    expect(validateQuestion("paciente CPF 123.456.789-00, e na grave?", { followUp: true })).toBe(
      "A pergunta parece conter um CPF. Retire qualquer dado que identifique o paciente.",
    );
  });

  test("acima de 500 caracteres é recusada", () => {
    expect(validateQuestion("a".repeat(501), { followUp: true })).toBe("A pergunta pode ter até 500 caracteres.");
  });
});
