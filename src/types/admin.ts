/** Dados de uso do Lúmen (função `admin_overview`). Só números, nunca o texto das perguntas. */
export interface AdminOverview {
  usersTotal: number;
  usersNew7d: number;
  usersNew30d: number;
  usersActive7d: number;
  usersBlocked: number;
  conversations: number;
  questions: number;
  questions7d: number;
  statusDone: number;
  statusNoEvidence: number;
  statusError: number;
  savedArticles: number;
  /** Votos em "Essa resposta ajudou?". */
  feedbackHelpful: number;
  feedbackNotHelpful: number;
  /** Motivos dos "não" ("" = sem motivo). */
  feedbackReasons: { reason: string; total: number }[];
  /** Especialidade (id de `specialties`, ou "" sem especialidade) e quantos médicos. */
  specialties: { specialty: string; total: number }[];
  /** Perguntas por dia, nos últimos 30 dias (horário de Brasília). */
  daily: { day: string; total: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  specialty: string | null;
  crm: string | null;
  crmUf: string | null;
  credits: number;
  isAdmin: boolean;
  blockedAt: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  questions: number;
}

export interface AdminInvite {
  id: string;
  email: string | null;
  code: string | null;
  reusable: boolean;
  uses: number;
  usedAt: string | null;
  usedByEmail: string | null;
  invitedBy: string | null;
  createdAt: string;
}

/** Resposta das ações do painel. `code`: o código recém-criado, para copiar. */
export interface AdminActionState {
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
}
