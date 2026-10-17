/**
 * Estado devolvido pelas server actions de formulário (useActionState).
 * `values` repõe os campos digitados após um erro, já que o React 19
 * limpa o formulário a cada envio. Senhas nunca voltam em `values`.
 */
export interface FormState<Field extends string = string> {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  values?: Partial<Record<Field, string>>;
}

export type SignInField = "email" | "password";

export type SignUpField =
  | "fullName"
  | "email"
  | "password"
  | "specialty"
  | "crm"
  | "crmUf"
  | "inviteCode";

export type ForgotPasswordField = "email";

export type ResetPasswordField = "password" | "passwordConfirm";
