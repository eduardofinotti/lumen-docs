import type { AdminInvite } from "@/types/admin";

/** Regras do painel /admin que não dependem do banco. */

export const MAX_CREDITS = 100_000;

// Sem 0/O e 1/I, que se confundem ao ditar ou ler no celular.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "-");
}

export function validateInviteCode(code: string): string | undefined {
  if (code.length < 4 || code.length > 32) return "Use de 4 a 32 caracteres.";
  if (!/^[A-Z0-9-]+$/.test(code)) return "Use só letras sem acento, números e hífen.";
  return undefined;
}

export function generateInviteCode(random: () => number = Math.random): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return `LUMEN-${suffix}`;
}

/** Créditos digitados no painel: inteiro de 0 a 100000, ou `null`. */
export function parseCredits(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n <= MAX_CREDITS ? n : null;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function filterUsers<T extends { fullName: string; email: string }>(users: T[], query: string): T[] {
  const q = fold(query.trim());
  if (!q) return users;
  return users.filter((u) => fold(u.fullName).includes(q) || fold(u.email).includes(q));
}

type Outcomes = { done: number; noEvidence: number; error: number };

/** Porcentagem (inteira) de cada resultado das perguntas respondidas. */
export function outcomeShares(o: Outcomes): Outcomes {
  const total = o.done + o.noEvidence + o.error;
  if (total === 0) return { done: 0, noEvidence: 0, error: 0 };
  const pct = (n: number) => Math.round((n / total) * 100);
  return { done: pct(o.done), noEvidence: pct(o.noEvidence), error: pct(o.error) };
}

/** % de votos "sim" em "Essa resposta ajudou?"; null sem votos. */
export function helpfulShare(yes: number, no: number): number | null {
  const total = yes + no;
  return total === 0 ? null : Math.round((yes / total) * 100);
}

const signups = (n: number) => `${n} ${n === 1 ? "cadastro" : "cadastros"}`;

/** Situação de um convite, como aparece na lista. `active`: ainda deixa alguém entrar. */
export function inviteStatus(i: AdminInvite): { label: string; active: boolean } {
  if (i.email) {
    return i.usedAt ? { label: "Cadastrado", active: false } : { label: "Aguardando cadastro", active: true };
  }
  if (!i.usedAt) {
    return { label: i.reusable ? `Ativo · ${signups(i.uses)}` : "Ativo · uso único", active: true };
  }
  // Uso único consumido guarda quem usou; encerrado pelo admin não.
  if (i.usedByEmail) return { label: `Usado por ${i.usedByEmail}`, active: false };
  return { label: `Encerrado · ${signups(i.uses)}`, active: false };
}
