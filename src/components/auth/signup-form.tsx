"use client";

import { useActionState } from "react";
import { signUp } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import { specialties, ufs } from "@/lib/specialties";
import type { FormState, SignUpField } from "@/types/forms";
import { Field } from "./field";
import { FormMessage } from "./form-message";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";

const initialState: FormState<SignUpField> = { status: "idle" };

export function SignUpForm() {
  const [state, formAction] = useActionState(signUp, initialState);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <h2 className="text-title">Confirme seu e-mail</h2>
        <p className="text-body text-ink-secondary">
          Enviamos um link para <span className="font-medium text-ink">{values.email}</span>. Abra
          a mensagem e clique no link para ativar sua conta. Se não encontrar, procure no spam.
        </p>
      </div>
    );
  }

  return (
    // key: remonta os campos quando o servidor devolve novos valores após um erro
    <form key={JSON.stringify(values)} action={formAction} noValidate className="space-y-5">
      {state.message && <FormMessage tone="error">{state.message}</FormMessage>}

      <Field id="fullName" label="Nome completo" error={errors.fullName}>
        {(p) => (
          <Input {...p} name="fullName" autoComplete="name" defaultValue={values.fullName} required />
        )}
      </Field>

      <Field id="email" label="E-mail" error={errors.email}>
        {(p) => (
          <Input
            {...p}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            defaultValue={values.email}
            required
          />
        )}
      </Field>

      <Field
        id="password"
        label="Senha"
        hint={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`}
        error={errors.password}
      >
        {(p) => (
          <PasswordInput
            {...p}
            name="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        )}
      </Field>

      <Field id="specialty" label="Especialidade" error={errors.specialty}>
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

      <Field
        id="inviteCode"
        label="Código de convite"
        hint="Se o seu e-mail foi autorizado pela equipe, pode deixar em branco."
        error={errors.inviteCode}
      >
        {(p) => (
          <Input
            {...p}
            name="inviteCode"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono uppercase"
            defaultValue={values.inviteCode}
          />
        )}
      </Field>

      <SubmitButton pendingLabel="Criando conta…">Criar conta</SubmitButton>
    </form>
  );
}
