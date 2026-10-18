# Conversa contínua e artigos salvos · design

Data: 2026-10-18 · Projeto: Lúmen (Next.js 15 + Supabase, ver `CLAUDE.md` e `supabase/README.md`)

## Por que

Hoje cada pesquisa é uma pergunta e uma resposta. O médico muitas vezes esquece um detalhe
ou quer variar a pergunta sem reescrevê-la: depois de "Colecistectomia na mesma internação
reduz recorrência na pancreatite biliar leve?", quer só escrever "e na grave?". Ele também
quer guardar artigos para rever depois, copiar a referência para usar em aula e ler o texto
completo, e baixar em PDF a resposta que o Lúmen gerou.

Referência de estrutura: a tela de conversa do Consensus (print enviado pelo usuário), com o
mesmo princípio do `CLAUDE.md`: copiar a estrutura, não o visual.

## Objetivos

1. Uma pesquisa vira uma **conversa**: depois da primeira resposta, o médico continua
   perguntando no mesmo contexto.
2. Cada pergunta da conversa é entendida no contexto das anteriores ("e na grave?" vira a
   pergunta completa) e o Lúmen decide sozinho se precisa de busca nova no PubMed ou se
   responde com os artigos já encontrados.
3. **Artigos salvos**: lista única de favoritos, com referência Vancouver para copiar e link
   para o texto completo.
4. **Baixar a resposta em PDF**: cada resposta da conversa pode ser baixada como documento.
5. Créditos: **1 crédito por pergunta** (inclusive as de continuação); padrão de **999**
   créditos por conta enquanto não há preço.

## Não objetivos (agora)

- Semantic Scholar e arXiv (próxima etapa, decidido pelo usuário).
- Pastas, etiquetas ou várias listas de favoritos (lista única por enquanto).
- Preço, compra de créditos, painel admin.
- Editar ou apagar mensagens da conversa; ramificar conversa.
- Baixar o PDF do artigo original: o Lúmen só aponta para o texto completo (PMC, DOI ou
  PubMed). O PDF é da resposta do Lúmen, não do artigo.
- Guardar PDFs no servidor: o documento é gerado na hora, no navegador.

## Anti-objetivos (seria fracasso mesmo funcionando)

- Citar artigo que não veio de uma busca desta conversa. A regra "só citar artigos recebidos
  da busca" vale para toda resposta, inclusive as que reaproveitam artigos.
- Dar conduta, dose ou prescrição; omitir a nota "A decisão clínica é do médico."
- Uma continuação que perde o contexto ("e na grave?" virar busca por "grave").
- PDF da resposta sem as referências ou sem a nota da decisão clínica.
- Quebrar o modo demonstração (env vazio deve continuar funcionando com mocks).

## Decisões do usuário

- Layout **B**: conversa em coluna à esquerda; painel à direita com os artigos da resposta
  selecionada (por padrão a mais recente; clicar numa resposta anterior troca o painel). No
  celular, os artigos de cada resposta ficam logo abaixo dela.
- 1 crédito por pergunta; padrão 999.
- Favoritos em lista única; usos: rever, copiar referência para aula, acessar o texto
  completo.
- "Baixar PDF" é da **resposta escolhida** (uma resposta por documento), não da conversa
  inteira e não do artigo.
- Semantic Scholar e arXiv depois.

## Decisões minhas (o usuário pode revisar)

- Contas existentes também passam a ter 999 créditos (`update profiles set credits = 999`).
- Cada resposta tem a **própria numeração** [1], [2]… (consequência do layout B: o painel
  mostra a lista daquela resposta).
- Limite de **20 perguntas por conversa** (custo e tamanho do contexto). Ao atingir, a caixa
  mostra "Esta conversa chegou ao limite. Comece uma nova pesquisa." e some.
- A conversa é **um item** no histórico e na sidebar, com o título da primeira pergunta,
  ordenada pela última atividade.
- O filtro de data escolhido na primeira pergunta vale para a conversa toda (sem seletor na
  caixa de continuação).
- O aviso de dados de paciente e a checagem de CPF (`src/lib/privacy.ts`) valem também nas
  continuações.
- Abaixo de cada pergunta de continuação aparece, em texto discreto, como o Lúmen a entendeu
  ("Entendi: A colecistectomia… na pancreatite biliar grave?"), para o médico perceber se o
  contexto foi mal interpretado. Na primeira pergunta não aparece.
- **Como o PDF é gerado**: uma versão da resposta feita para impressão (CSS de impressão,
  fontes do design system) e o botão abre o "Salvar como PDF" do navegador. Sem biblioteca
  nova. Alternativa descartada por ora: gerar o arquivo no servidor (exige dependência
  pesada).
- No PDF de uma continuação, o título é a pergunta completa como o Lúmen entendeu
  (`standalone_question`), porque "e na grave?" sozinho não faz sentido fora da conversa.
- **Crédito em caso de falha**: turno com `error` devolve o crédito (nova função
  `refund_credit`, só service role), não conta para o limite de 20 e mostra "Tentar de novo"
  (refaz a mesma pergunta na mesma posição). Turno `no_evidence` cobra normalmente.
- **Migration em duas fases**: `0003` cria as tabelas novas e faz o backfill sem apagar nada;
  depois que o front e a função novos estiverem no ar, `0004` remove de `searches` as colunas
  que migraram. Assim a versão antiga não quebra durante a troca.
- Duas continuações ao mesmo tempo na mesma conversa são recusadas no servidor (a posição do
  turno é única; a segunda recebe "Aguarde a resposta anterior.").
- Se o roteador escolher `reuse` mas a conversa não tiver artigos, faz busca nova.

## Como funciona

### Fluxo de uma continuação

1. O médico escreve na caixa fixa no rodapé da conversa e envia.
2. A pergunta aparece na coluna com o carregamento em etapas ("Entendendo a pergunta",
   "Buscando artigos" ou "Relendo os artigos", "Lendo e resumindo").
3. A Edge Function `search` recebe `{ searchId, question }`:
   - confere que a conversa é do usuário e não passou do limite;
   - debita 1 crédito (`debit_credit`);
   - **roteia** com uma chamada ao Claude que recebe as perguntas e respostas anteriores
     (texto, sem os resumos completos) e a lista de artigos já encontrados (número, PMID,
     título, tipo), e devolve JSON:
     `{ "action": "search" | "reuse", "standaloneQuestion": "...", "pubmedQuery": "..." }`.
     `standaloneQuestion` é a pergunta reescrita completa ("A colecistectomia na mesma
     internação reduz recorrência na pancreatite biliar grave?"). `pubmedQuery` só quando
     `action = "search"` (substitui a chamada atual de gerar a busca nesse caso);
   - `search`: esearch/efetch como hoje; os artigos encontrados são as fontes desta resposta;
   - `reuse`: as fontes desta resposta são os artigos já encontrados na conversa
     (sem repetir PMID, no máximo 12, priorizando os citados nas respostas anteriores);
   - síntese em português com o mesmo prompt de regras, recebendo também o histórico
     resumido da conversa para manter o fio, e só os artigos desta resposta numerados;
   - resumos por artigo: gerados só para artigos novos; artigos reaproveitados copiam o
     `summary_pt` já gravado;
   - grava a resposta (turno) e suas fontes.
4. A primeira pergunta usa o mesmo caminho sem `searchId` (cria a conversa). O roteador é
   pulado na primeira pergunta (sempre busca), mantendo o fluxo atual.
5. Se a busca não trouxer artigos, o turno fica `no_evidence` com a mensagem atual
   ("Não encontramos artigos para essa pergunta" + sugestão de ampliar).

### Modelo de dados (migration `0003`)

- `searches` passa a representar a conversa: mantém `id`, `user_id`, `question` (título =
  primeira pergunta), `date_range`, `created_at`; ganha `updated_at` (última atividade).
- Nova tabela `search_turns`: `id`, `search_id` (FK cascade), `position` (1, 2, …),
  `question` (como o médico escreveu), `standalone_question`, `action` (`search` | `reuse`),
  `status` (enum atual), `answer_md`, `pubmed_query`, `error`, `created_at`;
  `unique (search_id, position)`.
- `sources` ganha `turn_id` (FK para `search_turns`, cascade), `pmcid` e `doi`; a unicidade
  passa a ser `(turn_id, position)`. `search_id` pode continuar para facilitar a RLS.
- **Backfill**: cada `searches` existente vira o turno 1 com seu `status`, `answer_md`,
  `pubmed_query`, `error`; as `sources` existentes recebem o `turn_id` desse turno. As
  colunas antigas de `searches` só saem na `0004` (ver decisões).
- Nova tabela `saved_articles`: `id`, `user_id` (FK profiles, cascade), `pmid`, cópia dos
  dados para exibir e citar sem depender da conversa (`title`, `authors`, `journal`, `year`,
  `volume`, `issue`, `pages`, `evidence_label`, `summary_pt`, `pmcid`, `doi`), `search_id`
  (de onde veio; `on delete set null`), `created_at`; `unique (user_id, pmid)`.
- RLS: `search_turns` e `sources` com leitura pelo dono da conversa (escrita só pela função,
  service role); `saved_articles` com select/insert/delete do próprio usuário.
- `profiles.credits` com default 999 e `update` das contas existentes para 999.

### Edge Function `search`

- Corpo: `{ question, dateRange?, searchId? }`; resposta: `{ searchId, turnId, status, ... }`.
- `efetch` passa a extrair `pmcid` e `doi` de `<ArticleIdList>`.
- Novo prompt do roteador em `prompts.ts`; a síntese recebe o histórico.
- Modelo e chamadas como hoje (`claude-sonnet-5-5`, `ask()` com esforço por chamada); o
  roteador usa esforço baixo.

### Tela da conversa (`/pesquisa/[id]`)

- Coluna da conversa: cada turno com a pergunta do médico (balão) e a resposta (markdown com
  citações). Turno `no_evidence`/`error` mostra a mensagem correspondente no lugar da
  resposta.
- Desktop: painel direito fixo com os artigos do turno selecionado; o turno selecionado tem
  destaque discreto; passar o mouse numa citação destaca o card, como hoje.
- Celular: os artigos de cada turno ficam abaixo dele, recolhidos ("6 artigos citados").
- Em cada resposta: "Copiar com referências" (como hoje) e "Baixar PDF".
- **PDF da resposta**: pergunta (ou `standalone_question` numa continuação), data e período
  de publicação, resposta com citações [n], a nota "A decisão clínica é do médico." e as
  referências em Vancouver com link para o PubMed; logo Lúmen no topo; sem menu, botões,
  sidebar ou painel. Tema claro sempre, mesmo com o modo escuro ligado.
- Caixa de continuação fixa no rodapé da coluna, com placeholder "Pergunte algo sobre esta
  pesquisa…", o aviso de dados de paciente e o contador de créditos já existente no topo.
- Enquanto um turno carrega, a caixa fica desabilitada.

### Artigos salvos (`/salvos`)

- Estrela (ícone de marcador) em cada card de artigo: salva ou remove. Estado visível
  ("Salvo"). Funciona na conversa e na própria página de salvos.
- Página "Artigos salvos" com link na sidebar (entre Histórico e a conta), protegida pelo
  middleware.
- Cada item: título, autores, periódico, ano, nível de evidência, resumo em português
  (recolhido), "Veio da pergunta: …" com link para a conversa, e ações:
  - **Copiar referência** (Vancouver, `formatVancouver`);
  - **Texto completo**: PubMed Central quando há `pmcid`; senão DOI (`https://doi.org/…`);
    senão a página do PubMed;
  - **Remover**.
- No topo: "Copiar todas as referências" (lista numerada em Vancouver).
- Lista ordenada do mais recente para o mais antigo; estado vazio explica como salvar.

### Modo demonstração

- Continuação devolve um turno fictício (reutiliza `src/lib/mocks/results.ts`), guardado no
  cookie de demonstração junto com a conversa.
- Salvos em demonstração: cookie próprio com os PMIDs e os dados do mock.

### Documentação

- `CLAUDE.md`: mover "biblioteca pessoal de artigos salvos" de v2 para v1; descrever a
  conversa contínua e o padrão de 999 créditos; manter Semantic Scholar/arXiv como próxima
  etapa.
- `supabase/README.md`: novo contrato da função e a migration `0003`.

## Restrições

- Stack e regras do `CLAUDE.md` (pt-BR, sem `any`, server components por padrão, tokens do
  design system, laranja só nos usos permitidos, sem bibliotecas novas sem justificar).
- `pnpm lint` e `pnpm build` ao final; commits pequenos.
- A migration roda sobre dados reais: backfill sem perder pesquisas existentes.

## Deixado para quem construir

- Texto exato dos prompts (roteador e ajuste da síntese), respeitando as regras acima.
- Mecânica da versão de impressão (rota própria ou CSS de impressão na mesma página),
  desde que o botão leve direto ao "Salvar como PDF" e o documento saia como descrito.
- Detalhes visuais dentro do design system (espaçamentos, ícone do marcador, animações).
- Como apresentar o carregamento do turno dentro da coluna, desde que mantenha as etapas.
