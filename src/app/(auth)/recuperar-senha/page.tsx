import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { TextLink } from "@/components/auth/text-link";
import { isDemoMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      description="Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha."
      footer={
        <>
          Lembrou a senha? <TextLink href="/entrar">Entrar</TextLink>
        </>
      }
    >
      <ForgotPasswordForm demoMode={isDemoMode()} />
    </AuthShell>
  );
}
