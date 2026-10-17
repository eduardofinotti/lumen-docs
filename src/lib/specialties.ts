export const specialties = [
  { id: "anestesiologia", label: "Anestesiologia" },
  { id: "cardiologia", label: "Cardiologia" },
  { id: "cirurgia-geral", label: "Cirurgia geral" },
  { id: "clinica-medica", label: "Clínica médica" },
  { id: "dermatologia", label: "Dermatologia" },
  { id: "endocrinologia", label: "Endocrinologia e metabologia" },
  { id: "gastroenterologia", label: "Gastroenterologia" },
  { id: "geriatria", label: "Geriatria" },
  { id: "ginecologia-obstetricia", label: "Ginecologia e obstetrícia" },
  { id: "infectologia", label: "Infectologia" },
  { id: "medicina-emergencia", label: "Medicina de emergência" },
  { id: "medicina-familia", label: "Medicina de família e comunidade" },
  { id: "medicina-intensiva", label: "Medicina intensiva" },
  { id: "nefrologia", label: "Nefrologia" },
  { id: "neurologia", label: "Neurologia" },
  { id: "oftalmologia", label: "Oftalmologia" },
  { id: "oncologia", label: "Oncologia clínica" },
  { id: "ortopedia", label: "Ortopedia e traumatologia" },
  { id: "otorrinolaringologia", label: "Otorrinolaringologia" },
  { id: "pediatria", label: "Pediatria" },
  { id: "pneumologia", label: "Pneumologia" },
  { id: "psiquiatria", label: "Psiquiatria" },
  { id: "reumatologia", label: "Reumatologia" },
  { id: "urologia", label: "Urologia" },
  { id: "outra", label: "Outra especialidade" },
] as const;

export type SpecialtyId = (typeof specialties)[number]["id"];

export function isSpecialtyId(value: string): value is SpecialtyId {
  return specialties.some((s) => s.id === value);
}

export function specialtyLabel(id: string | null): string | null {
  return specialties.find((s) => s.id === id)?.label ?? null;
}

export const ufs = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export type Uf = (typeof ufs)[number];

export function isUf(value: string): value is Uf {
  return (ufs as readonly string[]).includes(value);
}
