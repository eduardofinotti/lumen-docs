"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import type { ForgotPasswordField, FormState } from "@/types/forms";
import { Field } from "./field";
import { FormMessage } from "./form-message";
import { SubmitButton } from "./submit-button";

const initialState: FormState<ForgotPasswordField> = { status: "idle" };

export function ForgotPasswordForm({ demoMode }: { demoMode: boolean }) {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  if (state.status === "success") {
    return (
      <FormMessage tone="info">
        {demoMode
          ? "Modo demonstração: nenhum e-mail foi enviado. No ambiente real, o link para criar uma nova senha chega por e-mail."
          : `Se houver uma conta com ${state.values?.email}, você vai receber um link para criar uma nova senha. Se não encontrar, procure no spam.`}
      </FormMessage>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.message && <FormMessage tone="error">{state.message}</FormMessage>}
      <Field id="email" label="E-mail" error={state.fieldErrors?.email}>
        {(p) => (
          <Input
            {...p}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            defaultValue={state.values?.email}
            required
          />
        )}
      </Field>
      <SubmitButton pendingLabel="Enviando…">Enviar link</SubmitButton>
    </form>
  );
}
