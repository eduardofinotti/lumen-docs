/**
 * Convites do modo demonstração. Com o Supabase configurado, quem valida é a
 * função `is_invite_valid` do banco (supabase/migrations).
 */
export const demoInviteCodes = ["LUMEN-DEMO"];

export const demoAuthorizedEmails = ["medico@lumen.test"];

export function isDemoInviteValid(email: string, code: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim().toUpperCase();
  return (
    demoAuthorizedEmails.includes(normalizedEmail) ||
    (normalizedCode !== "" && demoInviteCodes.includes(normalizedCode))
  );
}
