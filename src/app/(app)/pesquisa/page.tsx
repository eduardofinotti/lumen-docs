import type { Metadata } from "next";
import { SearchHome } from "@/components/search/search-home";
import { getCurrentProfile } from "@/lib/data/profile";
import { suggestionsBySpecialty } from "@/lib/mocks/suggestions";
import { specialtyLabel } from "@/lib/specialties";

export const metadata: Metadata = { title: "Pesquisa" };

export default async function PesquisaPage() {
  const profile = await getCurrentProfile();
  const specialty = profile?.specialty ?? "clinica-medica";
  const label = specialtyLabel(specialty);

  return (
    <SearchHome
      suggestionsTitle={specialty === "outra" || !label ? "Sugestões de pergunta" : `Sugestões em ${label}`}
      suggestions={suggestionsBySpecialty[specialty]}
    />
  );
}
