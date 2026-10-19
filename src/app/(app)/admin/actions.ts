"use server";

import { revalidatePath } from "next/cache";
import { readField, validateEmail } from "@/lib/auth/validation";
import { generateInviteCode, normalizeInviteCode, parseCredits, validateInviteCode } from "@/lib/admin";
import { getCurrentProfile } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import type { AdminActionState } from "@/types/admin";

const DEMO_NOTE = "Modo demonstração: nada foi salvo.";
const FAILED = "Não foi possível salvar agora. Tente de novo em instantes.";

/** O banco confere de novo; isto só evita a chamada para quem não é admin. */
async function adminClient() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) return { denied: true as const };
  return { denied: false as const, supabase: await createClient() };
}

function done(message: string): AdminActionState {
  revalidatePath("/admin");
  return { status: "success", message };
}

const fail = (message: string): AdminActionState => ({ status: "error", message });

export async function updateCredits(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const userId = readField(formData, "userId");
  const credits = parseCredits(readField(formData, "credits"));
  if (credits === null) return fail("Use um número inteiro de 0 a 100000.");

  const ctx = await adminClient();
  if (ctx.denied) return fail("Acesso restrito.");
  if (!ctx.supabase) return { status: "success", message: DEMO_NOTE };

  const { error } = await ctx.supabase.rpc("admin_set_credits", { p_user: userId, p_credits: credits });
  return error ? fail(FAILED) : done("Créditos atualizados.");
}

export async function setBlocked(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const userId = readField(formData, "userId");
  const blocked = readField(formData, "blocked") === "true";

  const ctx = await adminClient();
  if (ctx.denied) return fail("Acesso restrito.");
  if (!ctx.supabase) return { status: "success", message: DEMO_NOTE };

  const { error } = await ctx.supabase.rpc("admin_set_blocked", { p_user: userId, p_blocked: blocked });
  if (error) return fail(error.code === "22023" ? "Você não pode bloquear a própria conta." : FAILED);
  return done(blocked ? "Acesso suspenso." : "Acesso reativado.");
}

export async function createInvite(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const kind = readField(formData, "kind");
  const reusable = formData.get("reusable") === "on";
  let email: string | null = null;
  let code: string | null = null;

  if (kind === "email") {
    email = readField(formData, "email").toLowerCase();
    const emailError = validateEmail(email);
    if (emailError) return fail(emailError);
  } else {
    const typed = normalizeInviteCode(readField(formData, "code"));
    code = typed || generateInviteCode();
    const codeError = validateInviteCode(code);
    if (codeError) return fail(codeError);
  }

  const ctx = await adminClient();
  if (ctx.denied) return fail("Acesso restrito.");
  if (!ctx.supabase) return { status: "success", message: DEMO_NOTE, code: code ?? undefined };

  const { error } = await ctx.supabase.rpc("admin_create_invite", {
    p_email: email,
    p_code: code,
    p_reusable: reusable,
  });
  if (error?.code === "23505") return fail(email ? "Esse e-mail já foi convidado." : "Esse código já existe.");
  if (error) return fail(FAILED);

  revalidatePath("/admin");
  return email
    ? { status: "success", message: `Convite criado para ${email}. Ele já pode se cadastrar sem código.` }
    : { status: "success", message: "Código criado.", code: code ?? undefined };
}

export async function closeInvite(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const ctx = await adminClient();
  if (ctx.denied) return fail("Acesso restrito.");
  if (!ctx.supabase) return { status: "success", message: DEMO_NOTE };
  const { error } = await ctx.supabase.rpc("admin_close_invite", { p_id: readField(formData, "inviteId") });
  return error ? fail(FAILED) : done("Código encerrado.");
}

export async function deleteInvite(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const ctx = await adminClient();
  if (ctx.denied) return fail("Acesso restrito.");
  if (!ctx.supabase) return { status: "success", message: DEMO_NOTE };
  const { error } = await ctx.supabase.rpc("admin_delete_invite", { p_id: readField(formData, "inviteId") });
  return error ? fail(FAILED) : done("Convite retirado.");
}
