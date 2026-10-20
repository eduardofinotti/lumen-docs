import "server-only";

import { demoAdminInvites, demoAdminOverview, demoAdminUsers } from "@/lib/mocks/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminInvite, AdminOverview, AdminUser } from "@/types/admin";

// As funções `admin_*` do banco conferem se quem chama é admin; aqui só traduzimos.

export async function getAdminOverview(): Promise<AdminOverview | null> {
  const supabase = await createClient();
  if (!supabase) return demoAdminOverview;
  const { data, error } = await supabase.rpc("admin_overview");
  if (error || !data) return null;
  // Antes da migration 0007 a função ainda não traz os votos.
  return { feedbackHelpful: 0, feedbackNotHelpful: 0, feedbackReasons: [], ...(data as Partial<AdminOverview>) } as AdminOverview;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  specialty: string | null;
  crm: string | null;
  crm_uf: string | null;
  credits: number;
  is_admin: boolean;
  blocked_at: string | null;
  created_at: string;
  last_active_at: string | null;
  questions: number;
}

export async function listAdminUsers(): Promise<AdminUser[] | null> {
  const supabase = await createClient();
  if (!supabase) return demoAdminUsers;
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error || !data) return null;
  return (data as UserRow[]).map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? "",
    specialty: r.specialty,
    crm: r.crm,
    crmUf: r.crm_uf,
    credits: r.credits,
    isAdmin: r.is_admin,
    blockedAt: r.blocked_at,
    createdAt: r.created_at,
    lastActiveAt: r.last_active_at,
    questions: Number(r.questions),
  }));
}

interface InviteRow {
  id: string;
  email: string | null;
  code: string | null;
  reusable: boolean;
  uses: number;
  used_at: string | null;
  used_by_email: string | null;
  invited_by: string | null;
  created_at: string;
}

export async function listAdminInvites(): Promise<AdminInvite[] | null> {
  const supabase = await createClient();
  if (!supabase) return demoAdminInvites;
  const { data, error } = await supabase.rpc("admin_list_invites");
  if (error || !data) return null;
  return (data as InviteRow[]).map((r) => ({
    id: r.id,
    email: r.email,
    code: r.code,
    reusable: r.reusable,
    uses: r.uses,
    usedAt: r.used_at,
    usedByEmail: r.used_by_email,
    invitedBy: r.invited_by,
    createdAt: r.created_at,
  }));
}
