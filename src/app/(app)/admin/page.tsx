import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminTabs, type AdminTab } from "@/components/admin/admin-tabs";
import { InvitesPanel } from "@/components/admin/invites-panel";
import { Overview } from "@/components/admin/overview";
import { UsersPanel } from "@/components/admin/users-panel";
import { getAdminOverview, listAdminInvites, listAdminUsers } from "@/lib/data/admin";
import { getCurrentProfile } from "@/lib/data/profile";

export const metadata: Metadata = { title: "Administração", robots: { index: false } };

function LoadError() {
  return (
    <p className="rounded-lg border border-line bg-surface-raised p-6 text-body text-ink-secondary">
      Não foi possível carregar os dados agora. Recarregue a página em instantes.
    </p>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const profile = await getCurrentProfile();
  // Para quem não é admin, a página simplesmente não existe.
  if (!profile?.isAdmin) notFound();

  const { aba } = await searchParams;
  const tab: AdminTab = aba === "usuarios" || aba === "codigos" ? aba : "geral";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
      <h1 className="font-display text-display-md">Administração</h1>
      <p className="mt-2 text-body text-ink-secondary">
        Uso do Lúmen, médicos cadastrados e códigos de acesso. O texto das perguntas não aparece aqui.
      </p>

      <AdminTabs current={tab} />

      <div className="mt-8">
        {tab === "geral" && <OverviewTab />}
        {tab === "usuarios" && <UsersTab currentUserId={profile.id} />}
        {tab === "codigos" && <InvitesTab />}
      </div>
    </div>
  );
}

async function OverviewTab() {
  const data = await getAdminOverview();
  return data ? <Overview data={data} /> : <LoadError />;
}

async function UsersTab({ currentUserId }: { currentUserId: string }) {
  const users = await listAdminUsers();
  return users ? <UsersPanel users={users} currentUserId={currentUserId} /> : <LoadError />;
}

async function InvitesTab() {
  const invites = await listAdminInvites();
  return invites ? <InvitesPanel invites={invites} /> : <LoadError />;
}
