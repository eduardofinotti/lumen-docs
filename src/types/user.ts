import type { SpecialtyId } from "@/lib/specialties";

/** Linha de `profiles` no Supabase, em camelCase. */
export interface Profile {
  id: string;
  email: string;
  fullName: string;
  specialty: SpecialtyId | null;
  crm: string | null;
  crmUf: string | null;
  credits: number;
  createdAt: string;
}

/** Conteúdo do cookie de sessão do modo demonstração. */
export interface DemoSession {
  email: string;
  fullName: string;
  specialty: string | null;
  crm?: string | null;
  crmUf?: string | null;
}
