import type { SpecialtyId } from "@/lib/specialties";
import { mockQuestions } from "./results";

/** Três perguntas clínicas sugeridas por especialidade (tela inicial da pesquisa). */
export const suggestionsBySpecialty: Record<SpecialtyId, [string, string, string]> = {
  anestesiologia: [
    "Dexametasona no intraoperatório reduz náusea e vômito pós-operatórios?",
    "Bloqueio do plano transverso do abdome reduz o consumo de opioide após cesariana?",
    "Sugamadex reduz complicações pulmonares pós-operatórias em comparação com neostigmina?",
  ],
  cardiologia: [
    mockQuestions.sglt2,
    "Colchicina em baixa dose reduz eventos cardiovasculares após infarto agudo do miocárdio?",
    "Anticoagulação na fibrilação atrial subclínica detectada por dispositivo reduz AVC?",
  ],
  "cirurgia-geral": [
    "Antibiótico isolado é alternativa à apendicectomia na apendicite não complicada?",
    "Fio de sutura com triclosan reduz infecção de sítio cirúrgico?",
    "Colecistectomia na mesma internação reduz recorrência na pancreatite biliar leve?",
  ],
  "clinica-medica": [
    "Corticoide sistêmico reduz mortalidade na pneumonia adquirida na comunidade grave?",
    "Suplementação de vitamina D reduz quedas em idosos que vivem na comunidade?",
    "Meta pressórica intensiva reduz eventos cardiovasculares em hipertensos sem diabetes?",
  ],
  dermatologia: [
    "Dupilumabe é eficaz na dermatite atópica moderada a grave em adolescentes?",
    "Nicotinamida oral reduz novos cânceres de pele não melanoma em pacientes de alto risco?",
    "Isotretinoína em baixa dose é eficaz na acne moderada?",
  ],
  endocrinologia: [
    mockQuestions.metformina,
    "Agonistas de GLP-1 reduzem eventos cardiovasculares em pacientes com diabetes tipo 2?",
    "Levotiroxina no hipotireoidismo subclínico melhora sintomas em idosos?",
  ],
  gastroenterologia: [
    "Uso prolongado de inibidor de bomba de prótons aumenta o risco de fratura?",
    "Rifaximina previne recorrência de encefalopatia hepática?",
    "Probióticos reduzem diarreia associada a antibióticos em adultos?",
  ],
  geriatria: [
    "Exercício multicomponente reduz quedas em idosos institucionalizados?",
    "Desprescrição de benzodiazepínicos em idosos reduz quedas?",
    "Suplementação proteica melhora a força muscular em idosos com sarcopenia?",
  ],
  "ginecologia-obstetricia": [
    mockQuestions.progesterona,
    "Ácido acetilsalicílico em baixa dose reduz pré-eclâmpsia em gestantes de alto risco?",
    "Indução do trabalho de parto com 39 semanas reduz cesariana em nulíparas?",
  ],
  infectologia: [
    "Antibioticoterapia de curta duração é não inferior na pielonefrite em adultos?",
    "Doxiciclina pós-exposição reduz infecções sexualmente transmissíveis bacterianas?",
    "Troca precoce de antibiótico intravenoso para oral é segura na endocardite estável?",
  ],
  "medicina-emergencia": [
    "Ácido tranexâmico precoce reduz mortalidade no trauma com sangramento?",
    "Cetamina comparada a etomidato na intubação de sequência rápida altera mortalidade?",
    "Videolaringoscopia aumenta o sucesso na primeira tentativa de intubação na emergência?",
  ],
  "medicina-familia": [
    "Intervenção breve na atenção primária reduz o consumo de álcool de risco?",
    "Rastreamento com tomografia de baixa dose reduz mortalidade por câncer de pulmão em tabagistas?",
    "Estatina na prevenção primária reduz mortalidade em adultos acima de 75 anos?",
  ],
  "medicina-intensiva": [
    "Solução balanceada comparada à salina reduz lesão renal em pacientes críticos?",
    "Corticoide reduz mortalidade no choque séptico?",
    "Meta conservadora de oxigenação reduz mortalidade na ventilação mecânica?",
  ],
  nefrologia: [
    "Inibidores de SGLT2 retardam a progressão da doença renal crônica sem diabetes?",
    "Bicarbonato oral retarda a progressão da doença renal crônica com acidose metabólica?",
    "Finerenona reduz desfechos renais na doença renal do diabetes?",
  ],
  neurologia: [
    "Trombectomia mecânica é benéfica no AVC isquêmico com grande núcleo de infarto?",
    "Tenecteplase é não inferior à alteplase na trombólise do AVC isquêmico?",
    "Anticorpos anti-CGRP reduzem dias de enxaqueca na enxaqueca crônica?",
  ],
  oftalmologia: [
    "Atropina em baixa dose retarda a progressão da miopia em crianças?",
    "Suplementação AREDS reduz a progressão da degeneração macular relacionada à idade?",
    "Trabeculoplastia seletiva a laser como primeira linha é comparável a colírios no glaucoma?",
  ],
  oncologia: [
    "Exercício físico durante a quimioterapia reduz fadiga no câncer de mama?",
    "Imunoterapia neoadjuvante melhora a sobrevida livre de eventos no câncer de pulmão?",
    "Olanzapina reduz náusea e vômito na quimioterapia altamente emetogênica?",
  ],
  ortopedia: [
    "Cirurgia artroscópica é superior à fisioterapia na lesão degenerativa de menisco?",
    "Ácido tranexâmico reduz sangramento na artroplastia total de joelho?",
    "Plasma rico em plaquetas melhora a dor na osteoartrite de joelho?",
  ],
  otorrinolaringologia: [
    "Corticoide intratimpânico melhora a audição na surdez súbita idiopática?",
    "Amigdalectomia reduz episódios de amigdalite recorrente em adultos?",
    "Irrigação nasal com solução salina melhora sintomas na rinossinusite crônica?",
  ],
  pediatria: [
    "Introdução precoce de amendoim reduz alergia ao amendoim em lactentes de alto risco?",
    "Corticoide oral reduz internação em crianças com bronquiolite?",
    "Probióticos reduzem a duração da diarreia aguda em crianças?",
  ],
  pneumologia: [
    "Azitromicina contínua reduz exacerbações na DPOC?",
    "Terapia tripla inalatória reduz mortalidade na DPOC com exacerbações frequentes?",
    "Reabilitação pulmonar precoce após exacerbação de DPOC reduz readmissão?",
  ],
  psiquiatria: [
    "Escetamina intranasal é eficaz na depressão resistente ao tratamento?",
    "Lítio reduz o risco de suicídio nos transtornos do humor?",
    "Terapia cognitivo-comportamental para insônia é eficaz em pacientes com depressão?",
  ],
  reumatologia: [
    "Manter hidroxicloroquina reduz reativações no lúpus eritematoso sistêmico?",
    "Alopurinol com meta de ácido úrico reduz crises de gota?",
    "Inibidores de JAK aumentam o risco cardiovascular na artrite reumatoide?",
  ],
  urologia: [
    "Tansulosina facilita a expulsão de cálculos ureterais distais?",
    "Vigilância ativa é segura no câncer de próstata de baixo risco?",
    "Cranberry reduz infecção urinária recorrente em mulheres?",
  ],
  outra: [
    "Corticoide sistêmico reduz mortalidade na pneumonia adquirida na comunidade grave?",
    "Suplementação de vitamina D reduz quedas em idosos que vivem na comunidade?",
    "Meta pressórica intensiva reduz eventos cardiovasculares em hipertensos sem diabetes?",
  ],
};
