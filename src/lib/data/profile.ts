import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { DEMO_SESSION_COOKIE, decodeDemoSession } from "@/lib/auth/demo-session";
import { isSpecialtyId } from "@/lib/specialties";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/user";

export const DEMO_CREDITS = 999;

/** Perfil de quem está logado, ou `null`. Memorizado por requisição. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  if (!supabase) {
    const session = decodeDemoSession((await cookies()).get(DEMO_SESSION_COOKIE)?.value);
    if (!session) return null;
    return {
      id: "demo",
      email: session.email,
      fullName: session.fullName,
      specialty: session.specialty && isSpecialtyId(session.specialty) ? session.specialty : null,
      crm: session.crm ?? null,
      crmUf: session.crmUf ?? null,
      credits: DEMO_CREDITS,
      createdAt: new Date().toISOString(),
      // No modo demonstração o painel /admin mostra dados fictícios.
      isAdmin: true,
      blockedAt: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("full_name, specialty, crm, crm_uf, credits, created_at, is_admin, blocked_at")
    .eq("id", user.id)
    .maybeSingle<{
      full_name: string | null;
      specialty: string | null;
      crm: string | null;
      crm_uf: string | null;
      credits: number;
      created_at: string;
      is_admin: boolean;
      blocked_at: string | null;
    }>();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: data?.full_name ?? "",
    specialty: data?.specialty && isSpecialtyId(data.specialty) ? data.specialty : null,
    crm: data?.crm ?? null,
    crmUf: data?.crm_uf ?? null,
    credits: data?.credits ?? 0,
    createdAt: data?.created_at ?? user.created_at,
    isAdmin: data?.is_admin ?? false,
    blockedAt: data?.blocked_at ?? null,
  };
});
