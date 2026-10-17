import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE, decodeDemoSession } from "@/lib/auth/demo-session";
import {
  GUEST_ONLY_PREFIXES,
  HOME_AFTER_LOGIN,
  PROTECTED_PREFIXES,
  matchesPrefix,
} from "@/lib/auth/routes";
import { getSupabaseEnv } from "./config";

/**
 * Renova a sessão do Supabase a cada requisição e aplica as regras de acesso:
 * rotas de (app) sem sessão vão para /entrar; /entrar e /cadastro com sessão vão para /pesquisa.
 */
export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  let response = NextResponse.next({ request });
  let isLoggedIn: boolean;

  if (env) {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    // Não colocar código entre createServerClient e getUser: a renovação depende disso.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = user !== null;
  } else {
    isLoggedIn = decodeDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value) !== null;
  }

  const { pathname, search } = request.nextUrl;

  if (!isLoggedIn && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(url, response);
  }

  if (isLoggedIn && matchesPrefix(pathname, GUEST_ONLY_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = HOME_AFTER_LOGIN;
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

/** Redireciona preservando os cookies de sessão que o Supabase acabou de renovar. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
