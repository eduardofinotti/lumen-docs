import type { AuthError } from "@supabase/supabase-js";

/** Mensagem do cadastro quando não há convite (pré-checagem ou recusa do trigger). */
export const INVITE_ONLY_MESSAGE = "Cadastro por convite. Fale com a mentoria.";

/** Traduz erros do Supabase Auth para mensagens que dizem o que fazer. */
export function authErrorMessage(error: AuthError): string {
  // O trigger de `auth.users` recusa quem não tem convite; o Auth devolve "Database error saving new user".
  if (/database error/i.test(error.message)) return INVITE_ONLY_MESSAGE;
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos. Confira e tente de novo.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar. Procure a mensagem que enviamos, inclusive no spam.";
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com este e-mail. Entre ou recupere a senha.";
    case "weak_password":
      return "Essa senha é fácil de adivinhar. Use uma senha mais longa, misturando letras e números.";
    case "same_password":
      return "A nova senha precisa ser diferente da anterior.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
    case "session_not_found":
    case "session_expired":
      return "O link expirou. Peça um novo link de recuperação de senha.";
    default:
      return "Não foi possível concluir agora. Tente de novo em instantes.";
  }
}

/** Mensagens para erros que chegam por `?erro=` em /entrar (vindos de /auth/callback). */
export const callbackErrorMessages: Record<string, string> = {
  link: "O link é inválido ou expirou. Entre com e-mail e senha ou peça um novo link.",
};
