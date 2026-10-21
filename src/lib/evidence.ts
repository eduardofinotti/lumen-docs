import type { EvidenceLevel, EvidenceStrength } from "@/types/article";

export const evidenceLabels: Record<EvidenceLevel, string> = {
  "revisao-sistematica": "Revisão sistemática",
  "ensaio-clinico-randomizado": "Ensaio clínico randomizado",
  coorte: "Coorte",
  "caso-controle": "Caso-controle",
  "relato-de-caso": "Relato de caso",
  diretriz: "Diretriz",
  "diretriz-brasileira": "Diretriz brasileira",
  preprint: "Preprint",
  outro: "Outro",
};

export const evidenceStrength: Record<EvidenceLevel, EvidenceStrength> = {
  "revisao-sistematica": "alta",
  "ensaio-clinico-randomizado": "alta",
  coorte: "media",
  "caso-controle": "media",
  diretriz: "media",
  "diretriz-brasileira": "media",
  preprint: "baixa",
  "relato-de-caso": "baixa",
  outro: "baixa",
};

export function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

/** "Knowler WC, Barrett-Connor E, Fowler SE, et al." (até 3 autores, padrão Vancouver) */
export function formatAuthors(authors: string[]): string {
  if (authors.length <= 3) return authors.join(", ");
  return `${authors.slice(0, 3).join(", ")}, et al.`;
}
