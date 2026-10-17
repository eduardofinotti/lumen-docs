import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { TextLink } from "@/components/auth/text-link";
import { callbackErrorMessages } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;
  return (
    <AuthShell
      title="Entrar no Lúmen"
      footer={
        <>
          Recebeu um convite? <TextLink href="/cadastro">Criar conta</TextLink>
        </>
      }
    >
      <LoginForm next={safeNextPath(next)} notice={erro ? callbackErrorMessages[erro] : undefined} />
    </AuthShell>
  );
}
