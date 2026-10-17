import type { Article } from "@/types/article";

/** Pergunta exibida no mock da caixa de pergunta da landing. */
export const landingExampleQuestion =
  "Em adultos com pré-diabetes, a metformina reduz a progressão para diabetes tipo 2?";

/** Artigo real (Diabetes Prevention Program, NEJM 2002) usado no exemplo de resposta. */
export const landingExampleArticle: Article = {
  pmid: "11832527",
  title:
    "Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin",
  authors: ["Knowler WC", "Barrett-Connor E", "Fowler SE", "Hamman RF", "Lachin JM"],
  journal: "N Engl J Med",
  year: 2002,
  source: "PubMed",
  evidence: "ensaio-clinico-randomizado",
};
