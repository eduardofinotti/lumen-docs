import type { Metadata } from "next";
import { signOut } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acesso suspenso" };

export default function AcessoSuspensoPage() {
  return (
    <AuthShell
      title="Acesso suspenso"
      description="Sua conta está temporariamente sem acesso ao Lúmen. Fale com a mentoria para entender e reativar."
    >
      <form action={signOut}>
        <Button type="submit" variant="secondary" className="w-full">
          Sair
        </Button>
      </form>
    </AuthShell>
  );
}
