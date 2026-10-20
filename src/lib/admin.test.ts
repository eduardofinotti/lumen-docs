import { describe, expect, it } from "vitest";
import type { AdminInvite } from "@/types/admin";
import {
  filterUsers,
  inviteStatus,
  generateInviteCode,
  normalizeInviteCode,
  helpfulShare,
  outcomeShares,
  parseCredits,
  validateInviteCode,
} from "./admin";

describe("normalizeInviteCode", () => {
  it("passa para maiúsculas, tira espaços das pontas e troca os do meio por hífen", () => {
    expect(normalizeInviteCode("  lumen turma 3 ")).toBe("LUMEN-TURMA-3");
  });
});

describe("validateInviteCode", () => {
  it("aceita letras, números e hífen", () => {
    expect(validateInviteCode("LUMEN-BETA26")).toBeUndefined();
  });

  it("recusa código curto, longo ou com acento", () => {
    expect(validateInviteCode("AB1")).toBe("Use de 4 a 32 caracteres.");
    expect(validateInviteCode("A".repeat(33))).toBe("Use de 4 a 32 caracteres.");
    expect(validateInviteCode("LÚMEN")).toBe("Use só letras sem acento, números e hífen.");
  });
});

describe("generateInviteCode", () => {
  it("gera LUMEN- e 6 caracteres sem os que se confundem (0, O, 1, I)", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^LUMEN-[A-HJ-NP-Z2-9]{6}$/);
    expect(validateInviteCode(code)).toBeUndefined();
  });

  it("usa o sorteio recebido", () => {
    expect(generateInviteCode(() => 0)).toBe("LUMEN-AAAAAA");
  });
});

describe("parseCredits", () => {
  it("aceita inteiro de 0 a 100000", () => {
    expect(parseCredits("0")).toBe(0);
    expect(parseCredits(" 250 ")).toBe(250);
  });

  it("recusa vazio, negativo, fração e acima do limite", () => {
    expect(parseCredits("")).toBeNull();
    expect(parseCredits("-1")).toBeNull();
    expect(parseCredits("2.5")).toBeNull();
    expect(parseCredits("100001")).toBeNull();
  });
});

describe("filterUsers", () => {
  const users = [
    { fullName: "Ana Lúcia Prado", email: "ana@clinica.com" },
    { fullName: "Bruno Costa", email: "bcosta@gmail.com" },
  ];

  it("busca por nome sem ligar para acento e maiúsculas", () => {
    expect(filterUsers(users, "lucia")).toEqual([users[0]]);
  });

  it("busca por e-mail", () => {
    expect(filterUsers(users, "GMAIL")).toEqual([users[1]]);
  });

  it("devolve todos com a busca vazia", () => {
    expect(filterUsers(users, "  ")).toEqual(users);
  });
});

describe("outcomeShares", () => {
  it("dá a porcentagem de cada resultado", () => {
    expect(outcomeShares({ done: 8, noEvidence: 1, error: 1 })).toEqual({ done: 80, noEvidence: 10, error: 10 });
  });

  it("devolve zero sem perguntas", () => {
    expect(outcomeShares({ done: 0, noEvidence: 0, error: 0 })).toEqual({ done: 0, noEvidence: 0, error: 0 });
  });
});

describe("inviteStatus", () => {
  const base: AdminInvite = {
    id: "1", email: null, code: "LUMEN-X", reusable: false, uses: 0, usedAt: null,
    usedByEmail: null, invitedBy: null, createdAt: "2026-10-01T12:00:00Z",
  };
  const used = "2026-10-10T12:00:00Z";

  it("código reutilizável ativo mostra os usos", () => {
    expect(inviteStatus({ ...base, reusable: true, uses: 3 })).toEqual({ label: "Ativo · 3 cadastros", active: true });
    expect(inviteStatus({ ...base, reusable: true, uses: 1 })).toEqual({ label: "Ativo · 1 cadastro", active: true });
  });

  it("código de uso único ainda livre", () => {
    expect(inviteStatus(base)).toEqual({ label: "Ativo · uso único", active: true });
  });

  it("código de uso único já usado diz por quem", () => {
    expect(inviteStatus({ ...base, uses: 1, usedAt: used, usedByEmail: "ana@x.com" })).toEqual({
      label: "Usado por ana@x.com",
      active: false,
    });
  });

  it("código encerrado pelo admin", () => {
    expect(inviteStatus({ ...base, uses: 4, usedAt: used })).toEqual({ label: "Encerrado · 4 cadastros", active: false });
  });

  it("convite por e-mail aguardando ou já cadastrado", () => {
    const email = { ...base, code: null, email: "b@x.com" };
    expect(inviteStatus(email)).toEqual({ label: "Aguardando cadastro", active: true });
    expect(inviteStatus({ ...email, uses: 1, usedAt: used, usedByEmail: "b@x.com" })).toEqual({
      label: "Cadastrado",
      active: false,
    });
  });
});

describe("helpfulShare", () => {
  it("dá a porcentagem de respostas que ajudaram", () => {
    expect(helpfulShare(3, 1)).toBe(75);
    expect(helpfulShare(2, 1)).toBe(67);
  });

  it("sem votos, null (não mostra 0%)", () => {
    expect(helpfulShare(0, 0)).toBeNull();
  });
});
