import type { Article } from "@/types/article";
import { mockQuestions } from "./results";

/** Pergunta exibida no mock da caixa de pergunta da landing. */
export const landingExampleQuestion = mockQuestions.metformina;

/** Artigo real (Diabetes Prevention Program, NEJM 2002) usado no exemplo de resposta. */
export const landingExampleArticle: Article = {
  pmid: "11832527",
  title:
    "Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin",
  authors: [
    "Knowler WC",
    "Barrett-Connor E",
    "Fowler SE",
    "Hamman RF",
    "Lachin JM",
    "Walker EA",
    "Nathan DM",
  ],
  journal: "N Engl J Med",
  year: 2002,
  volume: "346",
  issue: "6",
  pages: "393-403",
  source: "PubMed",
  evidence: "ensaio-clinico-randomizado",
};
