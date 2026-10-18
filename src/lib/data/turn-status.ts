import type { SearchStatus } from "@/types/search";

/** Mesmo limite da Edge Function (`STALE_PENDING_MS` em supabase/functions/search/conversation.ts). */
const STALE_PENDING_MS = 5 * 60 * 1000;

/**
 * Status para mostrar: um turno "pending" há mais de 5 minutos foi interrompido e aparece
 * como erro, com "Tentar de novo" (a função devolve o crédito ao refazer).
 */
export function effectiveStatus(status: SearchStatus, createdAt: string, now: Date = new Date()): SearchStatus {
  if (status === "pending" && now.getTime() - new Date(createdAt).getTime() > STALE_PENDING_MS) return "error";
  return status;
}
