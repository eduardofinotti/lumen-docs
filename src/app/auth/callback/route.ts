import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino dos links do Supabase: confirmação de e-mail, recuperação de senha e
 * retorno do Google. Troca o `code` por uma sessão e segue para `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  // O Supabase devolve o erro do trigger de convite como "Database error saving new user".
  const errorDescription = searchParams.get("error_description") ?? "";
  if (errorDescription) {
    const erro = /database error/i.test(errorDescription) ? "convite" : "link";
    return NextResponse.redirect(`${origin}/entrar?erro=${erro}`);
  }

  const supabase = await createClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
