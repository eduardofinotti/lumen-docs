import type { DemoSession } from "@/types/user";

/**
 * Sessão do modo demonstração (sem Supabase). Guardada num cookie httpOnly;
 * não é segura e só existe para navegar pelas telas na fase de front-end.
 */
export const DEMO_SESSION_COOKIE = "lumen-demo-sessao";

export function encodeDemoSession(session: DemoSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeDemoSession(value: string | undefined): DemoSession | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (
      parsed &&
      typeof parsed === "object" &&
      "email" in parsed &&
      typeof parsed.email === "string" &&
      "fullName" in parsed &&
      typeof parsed.fullName === "string"
    ) {
      const specialty =
        "specialty" in parsed && typeof parsed.specialty === "string" ? parsed.specialty : null;
      const text = (key: string) => {
        const value: unknown = (parsed as Record<string, unknown>)[key];
        return typeof value === "string" ? value : null;
      };
      return { email: parsed.email, fullName: parsed.fullName, specialty, crm: text("crm"), crmUf: text("crmUf") };
    }
  } catch {
    // cookie corrompido: trata como sem sessão
  }
  return null;
}

export const demoCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
