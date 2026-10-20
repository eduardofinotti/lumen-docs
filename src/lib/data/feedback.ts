import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Feedback } from "@/types/search";

/**
 * Grava o voto do médico numa resposta (um por resposta; votar de novo troca).
 * A RLS só aceita voto em resposta concluída de conversa do próprio médico.
 * Na demonstração não há onde guardar: devolve ok e o voto fica só na tela.
 */
export async function saveFeedback(turnId: string, feedback: Feedback): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return true;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("turn_feedback").upsert(
    {
      turn_id: turnId,
      user_id: user.id,
      helpful: feedback.helpful,
      reason: feedback.helpful ? null : feedback.reason,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "turn_id,user_id" },
  );
  if (error) console.error("[Lúmen] voto não gravado", error.message);
  return !error;
}
