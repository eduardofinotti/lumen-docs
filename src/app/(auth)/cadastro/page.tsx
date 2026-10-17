import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";
import { TextLink } from "@/components/auth/text-link";
import { isDemoMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <AuthShell
      title="Criar conta"
      description="O acesso ao Lúmen é por convite nesta fase inicial."
      footer={
        <>
          Já tem conta? <TextLink href="/entrar">Entrar</TextLink>
        </>
      }
    >
      <SignUpForm demoMode={isDemoMode()} />
    </AuthShell>
  );
}
