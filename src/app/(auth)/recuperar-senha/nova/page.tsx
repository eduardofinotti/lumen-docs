import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormMessage } from "@/components/auth/form-message";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { TextLink } from "@/components/auth/text-link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nova senha" };

export default async function NovaSenhaPage() {
  // O link de recuperação cria uma sessão em /auth/callback; sem ela, o link expirou.
  const supabase = await createClient();
  const hasSession = supabase ? (await supabase.auth.getUser()).data.user !== null : true;

  return (
    <AuthShell title="Criar nova senha" description="Escolha a senha que você vai usar para entrar.">
      {hasSession ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4">
          <FormMessage tone="error">O link expirou ou já foi usado.</FormMessage>
          <p className="text-body-sm">
            <TextLink href="/recuperar-senha">Pedir um novo link</TextLink>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
