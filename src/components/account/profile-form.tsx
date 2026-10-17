"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/(app)/conta/actions";
import { Field } from "@/components/auth/field";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { specialties, ufs } from "@/lib/specialties";
import type { FormState, ProfileField } from "@/types/forms";
import type { Profile } from "@/types/user";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateProfile, {
    status: "idle",
  } satisfies FormState<ProfileField>);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {
    fullName: profile.fullName,
    specialty: profile.specialty ?? "",
    crm: profile.crm ?? "",
    crmUf: profile.crmUf ?? "",
  };

  return (
    // key: remonta os campos quando o servidor devolve novos valores
    <form key={JSON.stringify(values)} action={formAction} noValidate className="space-y-5">
      {state.message && (
        <FormMessage tone={state.status === "error" ? "error" : "info"}>{state.message}</FormMessage>
      )}

      <Field id="fullName" label="Nome completo" error={errors.fullName}>
        {(p) => <Input {...p} name="fullName" autoComplete="name" defaultValue={values.fullName} required />}
      </Field>

      <Field
        id="specialty"
        label="Especialidade"
        hint="Define as perguntas sugeridas na tela de pesquisa."
        error={errors.specialty}
      >
        {(p) => (
          <NativeSelect {...p} name="specialty" defaultValue={values.specialty ?? ""} required>
            <option value="" disabled>
              Escolha sua especialidade
            </option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        )}
      </Field>

      <div className="grid grid-cols-[1fr_6.5rem] gap-3">
        <Field id="crm" label="CRM" optional error={errors.crm}>
          {(p) => (
            <Input
              {...p}
              name="crm"
              inputMode="numeric"
              autoComplete="off"
              maxLength={7}
              defaultValue={values.crm}
            />
          )}
        </Field>
        <Field id="crmUf" label="UF" error={errors.crmUf}>
          {(p) => (
            <NativeSelect {...p} name="crmUf" defaultValue={values.crmUf ?? ""}>
              <option value="">—</option>
              {ufs.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </div>

      <SubmitButton pendingLabel="Salvando…" className="w-full sm:w-auto">
        Salvar alterações
      </SubmitButton>
    </form>
  );
}
