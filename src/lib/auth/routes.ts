/** Rotas do grupo (app): exigem sessão. */
export const PROTECTED_PREFIXES = ["/pesquisa", "/historico", "/conta", "/imprimir", "/salvos", "/admin"];

/** Telas de entrada: quem já tem sessão vai direto para a pesquisa. */
export const GUEST_ONLY_PREFIXES = ["/entrar", "/cadastro"];

export const HOME_AFTER_LOGIN = "/pesquisa";

export function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Aceita só caminhos internos, para evitar redirecionamento aberto via `?next=`. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return HOME_AFTER_LOGIN;
  }
  return next;
}
