const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

let warned = false;

/**
 * Credenciais do Supabase, ou `null` quando ainda não configurado.
 * Sem elas o app roda em modo demonstração, com dados de `src/lib/mocks`.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  if (url && anonKey) return { url, anonKey };
  if (!warned) {
    warned = true;
    console.warn(
      "[Lúmen] NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não definidos: usando modo demonstração com dados fictícios.",
    );
  }
  return null;
}

export function isDemoMode(): boolean {
  return getSupabaseEnv() === null;
}
