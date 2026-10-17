"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  DEMO_SESSION_COOKIE,
  decodeDemoSession,
  demoCookieOptions,
  encodeDemoSession,
} from "@/lib/auth/demo-session";
import { compactErrors, hasErrors, readField, validateCrmPair, validateFullName } from "@/lib/auth/validation";
import { isSpecialtyId } from "@/lib/specialties";
import { createClient } from "@/lib/supabase/server";
import type { FormState, ProfileField } from "@/types/forms";

/** Atualiza os dados cadastrais. E-mail e créditos não mudam por aqui. */
export async function updateProfile(
  _prev: FormState<ProfileField>,
  formData: FormData,
): Promise<FormState<ProfileField>> {
  const values = {
    fullName: readField(formData, "fullName"),
    specialty: readField(formData, "specialty"),
    crm: readField(formData, "crm"),
    crmUf: readField(formData, "crmUf"),
  };

  const crmErrors = validateCrmPair(values.crm, values.crmUf);
  const fieldErrors = compactErrors<ProfileField>({
    fullName: validateFullName(values.fullName),
    specialty: isSpecialtyId(values.specialty) ? undefined : "Escolha sua especialidade.",
    crm: crmErrors.crm,
    crmUf: crmErrors.crmUf,
  });
  if (hasErrors(fieldErrors)) return { status: "error", fieldErrors, values };

  const supabase = await createClient();
  const failed: FormState<ProfileField> = {
    status: "error",
    message: "Não foi possível salvar agora. Tente de novo em instantes.",
    values,
  };

  if (!supabase) {
    const store = await cookies();
    const session = decodeDemoSession(store.get(DEMO_SESSION_COOKIE)?.value);
    if (!session) return failed;
    store.set(
      DEMO_SESSION_COOKIE,
      encodeDemoSession({
        ...session,
        fullName: values.fullName,
        specialty: values.specialty,
        crm: values.crm || null,
        crmUf: values.crmUf || null,
      }),
      demoCookieOptions,
    );
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return failed;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.fullName,
        specialty: values.specialty,
        crm: values.crm || null,
        crm_uf: values.crmUf || null,
      })
      .eq("id", user.id);
    if (error) return failed;
  }

  // Nome na sidebar e sugestões da especialidade na tela de pesquisa.
  revalidatePath("/", "layout");
  return { status: "success", message: "Dados salvos.", values };
}
