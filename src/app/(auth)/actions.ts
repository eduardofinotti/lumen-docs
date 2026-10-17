"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEMO_SESSION_COOKIE,
  demoCookieOptions,
  encodeDemoSession,
} from "@/lib/auth/demo-session";
import { authErrorMessage } from "@/lib/auth/errors";
import { HOME_AFTER_LOGIN, safeNextPath } from "@/lib/auth/routes";
import {
  compactErrors,
  hasErrors,
  readField,
  readPassword,
  validateCrm,
  validateEmail,
  validateNewPassword,
} from "@/lib/auth/validation";
import { isDemoInviteValid } from "@/lib/mocks/invites";
import { isSpecialtyId, isUf } from "@/lib/specialties";
import { createClient } from "@/lib/supabase/server";
import type {
  ForgotPasswordField,
  FormState,
  ResetPasswordField,
  SignInField,
  SignUpField,
} from "@/types/forms";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function startDemoSession(email: string, fullName: string, specialty: string | null) {
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, encodeDemoSession({ email, fullName, specialty }), demoCookieOptions);
}

// ---------------------------------------------------------------- Entrar

export async function signIn(
  _prev: FormState<SignInField>,
  formData: FormData,
): Promise<FormState<SignInField>> {
  const email = readField(formData, "email").toLowerCase();
  const password = readPassword(formData, "password");
  const next = safeNextPath(readField(formData, "next"));

  const fieldErrors = compactErrors<SignInField>({
    email: validateEmail(email),
    password: password ? undefined : "Informe sua senha.",
  });
  if (hasErrors(fieldErrors)) return { status: "error", fieldErrors, values: { email } };

  const supabase = await createClient();
  if (!supabase) {
    await startDemoSession(email, "Médico de demonstração", "endocrinologia");
    redirect(next);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { status: "error", message: authErrorMessage(error), values: { email } };

  redirect(next);
}

// -------------------------------------------------------------- Cadastro

export async function signUp(
  _prev: FormState<SignUpField>,
  formData: FormData,
): Promise<FormState<SignUpField>> {
  const values = {
    fullName: readField(formData, "fullName"),
    email: readField(formData, "email").toLowerCase(),
    specialty: readField(formData, "specialty"),
    crm: readField(formData, "crm"),
    crmUf: readField(formData, "crmUf"),
    inviteCode: readField(formData, "inviteCode").toUpperCase(),
  };
  const password = readPassword(formData, "password");

  const fieldErrors = compactErrors<SignUpField>({
    fullName: values.fullName.length >= 3 ? undefined : "Informe seu nome completo.",
    email: validateEmail(values.email),
    password: validateNewPassword(password),
    specialty: isSpecialtyId(values.specialty) ? undefined : "Escolha sua especialidade.",
    crm:
      validateCrm(values.crm) ??
      (!values.crm && values.crmUf ? "Informe o número do CRM ou deixe a UF em branco." : undefined),
    crmUf:
      values.crmUf && !isUf(values.crmUf)
        ? "Escolha a UF do CRM."
        : values.crm && !values.crmUf
          ? "Escolha a UF do CRM."
          : undefined,
    inviteCode: undefined,
  });
  if (hasErrors(fieldErrors)) return { status: "error", fieldErrors, values };

  const supabase = await createClient();

  const invited = supabase
    ? await supabase
        .rpc("is_invite_valid", { p_email: values.email, p_code: values.inviteCode })
        .then(({ data, error }) => !error && data === true)
    : isDemoInviteValid(values.email, values.inviteCode);

  if (!invited) {
    return {
      status: "error",
      fieldErrors: {
        inviteCode: values.inviteCode
          ? "Este código de convite não é válido ou já foi usado. Confira e tente de novo."
          : "Este e-mail não está na lista de convidados. Informe o código de convite que você recebeu.",
      },
      values,
    };
  }

  if (!supabase) {
    // Modo demonstração: sem e-mail de confirmação, a conta já entra.
    await startDemoSession(values.email, values.fullName, values.specialty);
    redirect(HOME_AFTER_LOGIN);
  }

  const { error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${HOME_AFTER_LOGIN}`,
      // Lidos pelo trigger que cria a linha em `profiles` (supabase/migrations).
      data: {
        full_name: values.fullName,
        specialty: values.specialty,
        crm: values.crm || null,
        crm_uf: values.crmUf || null,
        invite_code: values.inviteCode || null,
      },
    },
  });
  if (error) return { status: "error", message: authErrorMessage(error), values };

  return { status: "success", values: { email: values.email } };
}

// ------------------------------------------------- Recuperação de senha

export async function requestPasswordReset(
  _prev: FormState<ForgotPasswordField>,
  formData: FormData,
): Promise<FormState<ForgotPasswordField>> {
  const email = readField(formData, "email").toLowerCase();
  const emailError = validateEmail(email);
  if (emailError) return { status: "error", fieldErrors: { email: emailError }, values: { email } };

  const supabase = await createClient();
  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await siteOrigin()}/auth/callback?next=/recuperar-senha/nova`,
    });
    // Só o limite de envio é mostrado; o resto não revela se o e-mail tem conta.
    if (error?.code === "over_email_send_rate_limit") {
      return { status: "error", message: authErrorMessage(error), values: { email } };
    }
  }

  return { status: "success", values: { email } };
}

export async function updatePassword(
  _prev: FormState<ResetPasswordField>,
  formData: FormData,
): Promise<FormState<ResetPasswordField>> {
  const password = readPassword(formData, "password");
  const passwordConfirm = readPassword(formData, "passwordConfirm");

  const fieldErrors = compactErrors<ResetPasswordField>({
    password: validateNewPassword(password),
    passwordConfirm: password === passwordConfirm ? undefined : "As senhas não são iguais.",
  });
  if (hasErrors(fieldErrors)) return { status: "error", fieldErrors };

  const supabase = await createClient();
  if (supabase) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { status: "error", message: authErrorMessage(error) };
  }

  redirect(HOME_AFTER_LOGIN);
}

// ------------------------------------------------------------------ Sair

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  } else {
    (await cookies()).delete(DEMO_SESSION_COOKIE);
  }
  redirect("/");
}
