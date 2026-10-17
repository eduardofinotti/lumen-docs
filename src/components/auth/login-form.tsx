"use client";

import { useActionState } from "react";
import { signIn } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import type { FormState, SignInField } from "@/types/forms";
import { Field } from "./field";
import { FormMessage } from "./form-message";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";
import { TextLink } from "./text-link";

const initialState: FormState<SignInField> = { status: "idle" };

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, formAction] = useActionState(signIn, initialState);
  const message = state.message ?? notice;

  return (
    <div className="space-y-6">
      {message && <FormMessage tone="error">{message}</FormMessage>}

      <form action={formAction} noValidate className="space-y-5">
        <input type="hidden" name="next" value={next} />
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
        <Field id="password" label="Senha" error={state.fieldErrors?.password}>
          {(p) => <PasswordInput {...p} name="password" autoComplete="current-password" required />}
        </Field>
        <p className="text-body-sm">
          <TextLink href="/recuperar-senha">Esqueci minha senha</TextLink>
        </p>
        <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
      </form>
    </div>
  );
}
