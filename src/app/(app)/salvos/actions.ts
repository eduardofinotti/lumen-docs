"use server";

import { revalidatePath } from "next/cache";
import { setSaved } from "@/lib/data/saved";

export type ToggleSavedResult = { ok: true; saved: boolean } | { ok: false; error: string };

/** Salva ou remove um artigo da lista do médico. */
export async function toggleSaved(pmid: string, searchId: string | null, save: boolean): Promise<ToggleSavedResult> {
  if (!/^\d{1,9}$/.test(pmid)) return { ok: false, error: "Artigo inválido." };
  const ok = await setSaved(pmid, searchId, save);
  if (!ok) return { ok: false, error: "Não foi possível salvar agora. Tente de novo." };
  revalidatePath("/salvos");
  return { ok: true, saved: save };
}
