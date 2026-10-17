"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import type { FormState, ResetPasswordField } from "@/types/forms";
import { Field } from "./field";
import { FormMessage } from "./form-message";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";

const initialState: FormState<ResetPasswordField> = { status: "idle" };

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.message && <FormMessage tone="error">{state.message}</FormMessage>}
      <Field
        id="password"
        label="Nova senha"
        hint={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`}
        error={state.fieldErrors?.password}
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
      <Field id="passwordConfirm" label="Repita a nova senha" error={state.fieldErrors?.passwordConfirm}>
        {(p) => <PasswordInput {...p} name="passwordConfirm" autoComplete="new-password" required />}
      </Field>
      <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
    </form>
  );
}
