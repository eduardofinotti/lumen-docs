import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { getCurrentProfile } from "@/lib/data/profile";
import { listConversations } from "@/lib/data/conversations";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  // O middleware já protege estas rotas; isto cobre sessão expirada entre as duas checagens.
  if (!profile) redirect("/entrar");

  const recent = await listConversations(20);

  return (
    <AppShell
      user={{ fullName: profile.fullName, credits: profile.credits }}
      recent={recent}
    >
      {children}
    </AppShell>
  );
}
