export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Senhas não passam por trim: espaços podem fazer parte delas. */
export function readPassword(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function validateEmail(email: string): string | undefined {
  if (!email) return "Informe seu e-mail.";
  if (!EMAIL_PATTERN.test(email)) return "Confira o e-mail: parece estar incompleto.";
  return undefined;
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return "Crie uma senha.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return undefined;
}

/** CRM: só números, até 7 dígitos. */
export function validateCrm(crm: string): string | undefined {
  if (!crm) return undefined;
  if (!/^\d{1,7}$/.test(crm)) return "Use só os números do CRM.";
  return undefined;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Remove entradas vazias, para o objeto caber em `fieldErrors`. */
export function compactErrors<Field extends string>(
  errors: Record<Field, string | undefined>,
): Partial<Record<Field, string>> {
  const result: Partial<Record<Field, string>> = {};
  for (const key of Object.keys(errors) as Field[]) {
    const message = errors[key];
    if (message) result[key] = message;
  }
  return result;
}
