import type { Article } from "@/types/article";
import type { Conclusion } from "@/types/search";

/**
 * Respostas de exemplo da fase de front-end. Os artigos são reais e os PMIDs
 * foram conferidos no PubMed; os resumos são escritos à mão para o mock.
 */
export interface MockResult {
  answerMd: string;
  conclusion: Conclusion | null;
  sources: Article[];
}

export const mockQuestions = {
  metformina: "Em adultos com pré-diabetes, a metformina reduz a progressão para diabetes tipo 2?",
  sglt2:
    "Inibidores de SGLT2 reduzem hospitalização por insuficiência cardíaca com fração de ejeção reduzida?",
  progesterona: "Progesterona vaginal reduz parto prematuro em gestantes com colo uterino curto?",
} as const;

export type MockResultKey = keyof typeof mockQuestions | "demonstracao";

export const mockResults: Record<MockResultKey, MockResult> = {
  metformina: {
    conclusion: {
      text: "A metformina reduz a progressão para diabetes tipo 2 em adultos de risco, com efeito menor que o da mudança intensiva no estilo de vida [1] [3].",
      strength: "alta",
      reason: "2 ECRs e uma revisão Cochrane",
    },
    answerMd: `Sim. Em adultos com risco aumentado, a metformina reduziu a incidência de diabetes tipo 2 em comparação com placebo, mas com efeito menor que o da intervenção intensiva no estilo de vida [1] [2].

- No Diabetes Prevention Program, a metformina reduziu a incidência de diabetes em 31% e a intervenção no estilo de vida em 58%, ambas comparadas a placebo [1].
- No seguimento de 15 anos, a redução se manteve, menor que no estudo original: 18% com metformina e 27% com estilo de vida. Não houve diferença entre os grupos no desfecho microvascular agregado [2].
- A revisão Cochrane confirma que a metformina reduz ou retarda o diabetes comparada a placebo ou cuidado padrão, sem vantagem consistente sobre dieta e exercício intensivos [3].

**Limitação:** a certeza da evidência sobre mortalidade e complicações do diabetes é baixa, porque poucos estudos acompanharam esses desfechos [3].`,
    sources: [
      {
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
        summary: {
          pergunta:
            "Intervenção no estilo de vida ou metformina previnem diabetes tipo 2 em adultos com glicemia alterada?",
          metodo:
            "Ensaio clínico randomizado multicêntrico com 3.234 adultos, comparando estilo de vida intensivo, metformina e placebo.",
          resultado:
            "Em seguimento médio de 2,8 anos, a incidência de diabetes caiu 58% com estilo de vida e 31% com metformina, comparadas a placebo.",
          limitacao:
            "População dos Estados Unidos com perfil de risco específico; efeito da metformina menor em pessoas mais velhas e com IMC mais baixo.",
          amostra: 3234,
        },
      },
      {
        pmid: "26377054",
        title:
          "Long-term effects of lifestyle intervention or metformin on diabetes development and microvascular complications over 15-year follow-up: the Diabetes Prevention Program Outcomes Study",
        authors: ["Diabetes Prevention Program Research Group"],
        journal: "Lancet Diabetes Endocrinol",
        year: 2015,
        volume: "3",
        issue: "11",
        pages: "866-75",
        source: "PubMed",
        evidence: "ensaio-clinico-randomizado",
        summary: {
          pergunta:
            "O efeito preventivo do estilo de vida e da metformina se mantém a longo prazo, e reduz complicações microvasculares?",
          metodo:
            "Seguimento de 15 anos dos participantes do Diabetes Prevention Program, com análise pela randomização original.",
          resultado:
            "Redução da incidência de diabetes de 27% com estilo de vida e 18% com metformina; sem diferença no desfecho microvascular agregado.",
          limitacao:
            "Após o fim do estudo original, todos os grupos receberam oferta de intervenção no estilo de vida, o que dilui as diferenças.",
        },
      },
      {
        pmid: "31794067",
        title:
          "Metformin for prevention or delay of type 2 diabetes mellitus and its associated complications in persons at increased risk for the development of type 2 diabetes mellitus",
        authors: ["Madsen KS", "Chi Y", "Metzendorf MI", "Richter B", "Hemmingsen B"],
        journal: "Cochrane Database Syst Rev",
        year: 2019,
        volume: "12",
        issue: "12",
        pages: "CD008558",
        source: "PubMed",
        evidence: "revisao-sistematica",
        summary: {
          pergunta:
            "A metformina previne ou retarda o diabetes tipo 2 e suas complicações em pessoas de risco aumentado?",
          metodo: "Revisão sistemática Cochrane com metanálise de ensaios clínicos randomizados.",
          resultado:
            "Metformina reduziu ou retardou o diabetes comparada a placebo ou cuidado padrão; comparada a dieta e exercício intensivos, sem diferença consistente.",
          limitacao:
            "Poucos dados sobre mortalidade, complicações e qualidade de vida; certeza da evidência moderada a baixa.",
        },
      },
    ],
  },

  sglt2: {
    conclusion: {
      text: "Dapagliflozina e empagliflozina reduzem hospitalização por insuficiência cardíaca com fração de ejeção reduzida [1] [2] [3].",
      strength: "alta",
      reason: "2 ECRs concordantes e metanálise",
    },
    answerMd: `Sim. Em pacientes com insuficiência cardíaca e fração de ejeção reduzida, dapagliflozina e empagliflozina reduziram o desfecho combinado de morte cardiovascular ou hospitalização por insuficiência cardíaca [1] [2] [3].

- No DAPA-HF, a dapagliflozina reduziu o desfecho combinado de piora da insuficiência cardíaca ou morte cardiovascular (HR 0,74), com efeito semelhante em pacientes com e sem diabetes [1].
- No EMPEROR-Reduced, a empagliflozina reduziu morte cardiovascular ou hospitalização por insuficiência cardíaca (HR 0,75) e desacelerou a queda da taxa de filtração glomerular [2].
- A metanálise dos dois ensaios mostrou redução também da mortalidade por todas as causas e da mortalidade cardiovascular [3].

**Limitação:** os ensaios incluíram pacientes com fração de ejeção de até 40% e já em tratamento otimizado; o seguimento foi de cerca de um ano e meio [1] [2].`,
    sources: [
      {
        pmid: "31535829",
        title: "Dapagliflozin in Patients with Heart Failure and Reduced Ejection Fraction",
        authors: [
          "McMurray JJV",
          "Solomon SD",
          "Inzucchi SE",
          "Køber L",
          "Kosiborod MN",
          "Martinez FA",
          "Ponikowski P",
        ],
        journal: "N Engl J Med",
        year: 2019,
        volume: "381",
        issue: "21",
        pages: "1995-2008",
        source: "PubMed",
        evidence: "ensaio-clinico-randomizado",
        summary: {
          pergunta:
            "A dapagliflozina reduz desfechos clínicos na insuficiência cardíaca com fração de ejeção reduzida, com ou sem diabetes?",
          metodo:
            "Ensaio clínico randomizado de fase 3 com 4.744 pacientes em classe funcional II a IV e fração de ejeção de até 40%, dapagliflozina 10 mg ou placebo.",
          resultado:
            "Redução do desfecho combinado de piora da insuficiência cardíaca ou morte cardiovascular (HR 0,74), semelhante em pacientes com e sem diabetes.",
          limitacao:
            "Seguimento mediano de 18 meses; poucos pacientes negros e em classe funcional IV.",
          amostra: 4744,
        },
      },
      {
        pmid: "32865377",
        title: "Cardiovascular and Renal Outcomes with Empagliflozin in Heart Failure",
        authors: [
          "Packer M",
          "Anker SD",
          "Butler J",
          "Filippatos G",
          "Pocock SJ",
          "Carson P",
          "Januzzi J",
        ],
        journal: "N Engl J Med",
        year: 2020,
        volume: "383",
        issue: "15",
        pages: "1413-1424",
        source: "PubMed",
        evidence: "ensaio-clinico-randomizado",
        summary: {
          pergunta:
            "A empagliflozina reduz morte cardiovascular ou hospitalização por insuficiência cardíaca na fração de ejeção reduzida?",
          metodo:
            "Ensaio clínico randomizado com 3.730 pacientes com fração de ejeção de até 40%, empagliflozina 10 mg ou placebo.",
          resultado:
            "Redução de morte cardiovascular ou hospitalização por insuficiência cardíaca (HR 0,75) e queda mais lenta da taxa de filtração glomerular.",
          limitacao:
            "Seguimento mediano de 16 meses; sem redução isolada significativa de morte cardiovascular.",
          amostra: 3730,
        },
      },
      {
        pmid: "32877652",
        title:
          "SGLT2 inhibitors in patients with heart failure with reduced ejection fraction: a meta-analysis of the EMPEROR-Reduced and DAPA-HF trials",
        authors: [
          "Zannad F",
          "Ferreira JP",
          "Pocock SJ",
          "Anker SD",
          "Butler J",
          "Filippatos G",
          "Brueckmann M",
        ],
        journal: "Lancet",
        year: 2020,
        volume: "396",
        issue: "10254",
        pages: "819-829",
        source: "PubMed",
        evidence: "revisao-sistematica",
        summary: {
          pergunta:
            "Somando DAPA-HF e EMPEROR-Reduced, os inibidores de SGLT2 reduzem mortalidade na fração de ejeção reduzida?",
          metodo: "Metanálise dos dois ensaios clínicos randomizados, com mais de 8 mil pacientes.",
          resultado:
            "Redução da mortalidade por todas as causas, da mortalidade cardiovascular e do desfecho renal combinado.",
          limitacao:
            "Baseada em apenas dois ensaios, com critérios de inclusão um pouco diferentes entre si.",
        },
      },
    ],
  },

  progesterona: {
    conclusion: {
      text: "A progesterona vaginal reduz o parto prematuro em gestação única com colo curto [1] [2] [3].",
      strength: "alta",
      reason: "ECRs e metanálise de dados individuais",
    },
    answerMd: `Sim. Em gestações únicas com colo uterino curto na ultrassonografia do segundo trimestre, a progesterona vaginal reduziu o parto prematuro [1] [2] [3].

- Em gestantes com colo de até 15 mm, a progesterona vaginal 200 mg reduziu o parto prematuro espontâneo antes de 34 semanas (19,2% contra 34,4% com placebo) [1].
- Em gestantes com colo entre 10 e 20 mm, o gel de progesterona vaginal reduziu o parto antes de 33 semanas e a síndrome do desconforto respiratório neonatal [2].
- A metanálise de dados individuais confirmou a redução do parto prematuro e da morbimortalidade neonatal, sem efeito adverso no neurodesenvolvimento aos 2 anos [3].

**Limitação:** os resultados valem para gestação única; os estudos usaram doses e pontos de corte do colo diferentes [1] [2].`,
    sources: [
      {
        pmid: "17671254",
        title: "Progesterone and the risk of preterm birth among women with a short cervix",
        authors: ["Fonseca EB", "Celik E", "Parra M", "Singh M", "Nicolaides KH"],
        journal: "N Engl J Med",
        year: 2007,
        volume: "357",
        issue: "5",
        pages: "462-9",
        source: "PubMed",
        evidence: "ensaio-clinico-randomizado",
        summary: {
          pergunta:
            "A progesterona vaginal reduz o parto prematuro espontâneo em gestantes com colo curto?",
          metodo:
            "Ensaio clínico randomizado com 250 gestantes com colo de até 15 mm, progesterona vaginal 200 mg ou placebo entre 24 e 34 semanas.",
          resultado:
            "Parto espontâneo antes de 34 semanas em 19,2% com progesterona contra 34,4% com placebo.",
          limitacao:
            "A redução da morbidade neonatal não foi estatisticamente significativa; amostra pequena para desfechos neonatais.",
          amostra: 250,
        },
      },
      {
        pmid: "21472815",
        title:
          "Vaginal progesterone reduces the rate of preterm birth in women with a sonographic short cervix: a multicenter, randomized, double-blind, placebo-controlled trial",
        authors: [
          "Hassan SS",
          "Romero R",
          "Vidyadhari D",
          "Fusey S",
          "Baxter JK",
          "Khandelwal M",
          "Vijayaraghavan J",
        ],
        journal: "Ultrasound Obstet Gynecol",
        year: 2011,
        volume: "38",
        issue: "1",
        pages: "18-31",
        source: "PubMed",
        evidence: "ensaio-clinico-randomizado",
        summary: {
          pergunta:
            "O gel de progesterona vaginal reduz o parto prematuro em gestantes com colo entre 10 e 20 mm?",
          metodo:
            "Ensaio clínico randomizado, duplo-cego e multicêntrico com 465 gestantes, gel de progesterona 90 mg ou placebo.",
          resultado:
            "Parto antes de 33 semanas em 8,9% com progesterona contra 16,1% com placebo, e menos síndrome do desconforto respiratório.",
          limitacao: "Excluiu colos abaixo de 10 mm e gestações múltiplas; resultado não se aplica a esses grupos.",
          amostra: 465,
        },
      },
      {
        pmid: "29157866",
        title:
          "Vaginal progesterone for preventing preterm birth and adverse perinatal outcomes in singleton gestations with a short cervix: a meta-analysis of individual patient data",
        authors: [
          "Romero R",
          "Conde-Agudelo A",
          "Da Fonseca E",
          "O'Brien JM",
          "Cetingoz E",
          "Creasy GW",
          "Hassan SS",
        ],
        journal: "Am J Obstet Gynecol",
        year: 2018,
        volume: "218",
        issue: "2",
        pages: "161-180",
        source: "PubMed",
        evidence: "revisao-sistematica",
        summary: {
          pergunta:
            "Somando os ensaios, a progesterona vaginal reduz parto prematuro e desfechos perinatais adversos com colo curto?",
          metodo:
            "Revisão sistemática com metanálise de dados individuais de ensaios clínicos randomizados em gestação única com colo de até 25 mm.",
          resultado:
            "Redução do parto prematuro e da morbimortalidade neonatal, sem efeito adverso no neurodesenvolvimento aos 2 anos.",
          limitacao: "Número limitado de ensaios; autores dos ensaios incluídos também conduziram a metanálise.",
        },
      },
    ],
  },

  demonstracao: {
    conclusion: null,
    answerMd: `**Resposta de demonstração.** A busca no PubMed ainda não está ligada nesta fase do Lúmen, então não há artigos para esta pergunta.

Por enquanto, só algumas perguntas sugeridas na tela inicial têm uma resposta de exemplo, com artigos reais.`,
    sources: [],
  },
};

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Escolhe a resposta de exemplo para uma pergunta digitada. */
export function mockResultKeyFor(question: string): MockResultKey {
  const q = normalize(question);
  for (const [key, text] of Object.entries(mockQuestions) as [keyof typeof mockQuestions, string][]) {
    if (normalize(text) === q) return key;
  }
  return "demonstracao";
}
