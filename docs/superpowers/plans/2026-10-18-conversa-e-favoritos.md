# Conversa contínua, artigos salvos e PDF da resposta · plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** transformar cada pesquisa numa conversa (perguntas de continuação com contexto), permitir salvar artigos numa lista única e baixar cada resposta em PDF.

**Architecture:** `searches` vira a conversa e ganha a tabela `search_turns` (um turno por pergunta); `sources` passa a pertencer a um turno. A Edge Function `search` recebe `searchId` opcional, roteia a continuação com o Claude (`search` ou `reuse`) e grava o turno. O front lê a conversa inteira, mostra o layout B (coluna + painel do turno selecionado), salva artigos em `saved_articles` e imprime uma resposta numa rota sem o shell do app.

**Tech Stack:** Next.js 15.5 (App Router, server actions), Supabase (Postgres + RLS + Edge Functions em Deno), `@anthropic-ai/sdk@0.131.0` com `claude-sonnet-5-5`, Tailwind v4, Vitest (novo, só dev).

**Spec:** `docs/superpowers/specs/2026-10-18-conversa-e-favoritos-design.md`

## Global Constraints

- Regras do `CLAUDE.md`: interface em pt-BR, nada de `any`, tipos em `src/types`, server components por padrão, tokens do design system, laranja `lumen` só em botão primário, citações [n], ícone ativo e foco.
- Toda resposta termina com "A decisão clínica é do médico." e só cita artigos recebidos de uma busca desta conversa.
- 1 crédito por pergunta; `profiles.credits` default **999** e contas existentes atualizadas para 999.
- Turno com `error` devolve o crédito, não conta para o limite e mostra "Tentar de novo"; `no_evidence` cobra.
- Limite de **20** perguntas por conversa (turnos que não são `error`). Ao atingir: "Esta conversa chegou ao limite. Comece uma nova pesquisa."
- Segunda pergunta enquanto outra está `pending` na mesma conversa: recusada com "Aguarde a resposta anterior."
- O período de publicação da primeira pergunta vale para a conversa toda.
- Modo demonstração (env vazio) continua funcionando com mocks em todas as telas novas.
- Dependência nova permitida: `vitest` (devDependency) para testar a lógica pura; nenhuma outra.
- `pnpm lint`, `pnpm test` e `pnpm build` passam ao fim de cada task; commits pequenos com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Depois de `pnpm build`, reiniciar o dev server (porta 3100) com `rm -rf .next`.

## Review Focus

1. O roteador devolve texto que não é JSON válido, ou um `action` desconhecido: a continuação não pode falhar; trata como `search` com a pergunta original. (Teste em Task 3: `parseRouterReply`.)
2. Pergunta de continuação com CPF ou nome de paciente: bloqueada antes de gastar crédito, com a mesma mensagem da primeira pergunta. (Teste em Task 4: `validateQuestion`.)
3. Pesquisas antigas, criadas antes da migration, abrem como conversa de um turno com resposta e artigos. (Verificação SQL em Task 2.)
4. Histórico longo enviado ao Claude: só os últimos 6 turnos, cada resposta cortada em 1.500 caracteres e sem marcadores [n] antigos. (Teste em Task 3: `buildHistory`.)
5. Salvar o mesmo artigo duas vezes (em respostas diferentes) não duplica nem dá erro; remover devolve o estado "não salvo". (Teste SQL em Task 2 e verificação manual em Task 7.)

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `vitest.config.ts` | Vitest com alias `@` → `src`, inclui `src/**/*.test.ts` e `supabase/functions/**/*.test.ts` |
| `supabase/migrations/0003_conversations.sql` | `search_turns`, colunas novas em `sources`/`searches`, backfill, `saved_articles`, `refund_credit`, créditos 999, RLS |
| `supabase/migrations/0004_drop_legacy_search_columns.sql` | Remove de `searches` as colunas que migraram (só depois do deploy) |
| `supabase/tests/0003_conversations.sql` | Asserções SQL rodadas num Postgres local |
| `supabase/functions/search/conversation.ts` | Lógica pura da conversa: roteador, histórico, seleção de artigos para `reuse` |
| `supabase/functions/search/conversation.test.ts` | Testes Vitest da lógica pura |
| `supabase/functions/search/prompts.ts` | + `SYSTEM_ROUTER`; síntese aceita histórico |
| `supabase/functions/search/index.ts` | Turnos, roteamento, devolução de crédito, `pmcid`/`doi` |
| `src/types/search.ts` | `Turn`, `Conversation`, `SearchSummary` |
| `src/types/article.ts` | `pmcid?`, `doi?`; `SavedArticle` |
| `src/lib/question.ts` | `validateQuestion` compartilhado pela primeira pergunta e pela continuação |
| `src/lib/data/conversations.ts` | Lê/cria/continua conversas (Supabase e demonstração); substitui `searches.ts` |
| `src/lib/data/saved.ts` | Lista, consulta e alterna artigos salvos (Supabase e demonstração) |
| `src/lib/article-links.ts` | `fullTextUrl(article)` |
| `src/lib/vancouver.ts` | `buildCopyText` passa a receber título + turno |
| `src/app/(app)/pesquisa/actions.ts` | `startSearch`, `continueSearch`, `retryTurn` |
| `src/app/(app)/salvos/{page,actions}.tsx/ts` | Página e `toggleSaved` |
| `src/app/(print)/imprimir/[turnId]/page.tsx` | Versão de impressão de uma resposta |
| `src/components/conversation/*` | `ConversationView`, `TurnBlock`, `FollowUpBox`, `SourcesPanel` |
| `src/components/articles/save-button.tsx` | Marcador de salvar |
| `src/components/saved/saved-list.tsx` | Lista da página de salvos |

`src/components/search/result-view.tsx` deixa de existir (vira `ConversationView`). `src/lib/data/searches.ts` vira `conversations.ts`.

---

### Task 1: Vitest

**Files:**
- Modify: `package.json` (script `"test": "vitest run"`, devDependency `vitest`)
- Create: `vitest.config.ts`
- Create: `src/lib/vancouver.test.ts`

**Interfaces:**
- Produces: `pnpm test` roda todos os `*.test.ts`.

- [ ] **Step 1:** `pnpm add -D vitest` e o script `test`. Justificativa (para o commit): testar a lógica pura da conversa e das referências sem subir o app.
- [ ] **Step 2:** `vitest.config.ts` com `resolve.alias` `{ "@": path.resolve(__dirname, "src") }`, `test.include` `["src/**/*.test.ts", "supabase/functions/**/*.test.ts"]`, `environment: "node"`.
- [ ] **Step 3: Teste de fumaça** em `src/lib/vancouver.test.ts`, com um artigo do mock `metformina` (PMID 11832527):

```ts
expect(formatVancouver(article)).toBe(
  "Knowler WC, Barrett-Connor E, Fowler SE, Hamman RF, Lachin JM, Walker EA, et al. Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin. N Engl J Med. 2002;346(6):393-403. PMID: 11832527.",
);
// ano nulo: sem localizador
expect(formatVancouver({ ...article, year: null, volume: undefined })).toBe(
  "Knowler WC, Barrett-Connor E, Fowler SE, Hamman RF, Lachin JM, Walker EA, et al. Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin. N Engl J Med. PMID: 11832527.",
);
```

Se o título/autores do mock diferirem, ajuste o esperado ao mock (não o código).
- [ ] **Step 4:** `pnpm test` → PASS; `pnpm lint` → sem erros.
- [ ] **Step 5:** Commit `Adiciona Vitest para a lógica pura`.

---

### Task 2: Migration 0003 (conversas, salvos, créditos)

**Files:**
- Create: `supabase/migrations/0003_conversations.sql`
- Create: `supabase/tests/0003_conversations.sql`

**Interfaces:**
- Produces (banco):
  - `search_turns(id uuid pk default gen_random_uuid(), search_id uuid not null → searches on delete cascade, position int not null, question text not null, standalone_question text, action text check in ('search','reuse'), status search_status not null default 'pending', answer_md text, pubmed_query text, error text, created_at timestamptz default now(), unique (search_id, position))`
  - `searches.updated_at timestamptz not null default now()`
  - `sources.turn_id uuid → search_turns on delete cascade`, `sources.pmcid text`, `sources.doi text`; unicidade `(turn_id, position)` no lugar de `(search_id, position)`.
  - `saved_articles(id uuid pk, user_id uuid not null → profiles on delete cascade, pmid text not null, title text not null, authors text, journal text, year int, volume text, issue text, pages text, evidence_label text, summary_pt text, pmcid text, doi text, search_id uuid → searches on delete set null, created_at timestamptz default now(), unique (user_id, pmid))`
  - `refund_credit(p_user uuid) returns void` (soma 1; execute revogado de public/anon/authenticated, como `debit_credit`).
  - `profiles.credits` default 999; `update public.profiles set credits = 999`.
- RLS:
  - `search_turns`: select se `exists (searches s where s.id = search_id and s.user_id = auth.uid())`; sem insert/update para usuários.
  - `sources`: policy atual continua (via `search_id`).
  - `saved_articles`: select/insert/delete com `auth.uid() = user_id`; sem update.
- Backfill: para cada `searches`, insere turno `position = 1` com `question`, `status`, `answer_md`, `pubmed_query`, `error`, `created_at` da conversa, `action = 'search'`; `update sources set turn_id = …` pelo `search_id`; `searches.updated_at = created_at`. **Não** remove colunas (isso é a `0004`).

- [ ] **Step 1: Escrever as asserções** em `supabase/tests/0003_conversations.sql`, rodando depois de `0001`, `0002` e de um seed mínimo (2 usuários em `auth.users` com convite, 1 pesquisa `done` com 2 `sources`, criados **antes** da `0003`), num bloco `do $$ … $$` que dá `raise exception` na primeira falha:
  - a pesquisa antiga tem exatamente 1 turno, `position = 1`, mesmo `answer_md`, e as 2 fontes com esse `turn_id`;
  - `profiles.credits = 999` para os dois usuários e o default da coluna é 999;
  - como usuário A (`set local role authenticated; set local request.jwt.claims = '{"sub":"<A>"}'`): lê seu turno; não lê turno de B; `insert into search_turns` falha;
  - `insert into saved_articles` do mesmo `pmid` duas vezes para A: a segunda viola `unique` (o app usa `upsert`/`on conflict do nothing`); A não lê salvos de B;
  - `refund_credit` não pode ser executada por `authenticated`.
- [ ] **Step 2: Rodar contra um Postgres local só com `0001` + `0002` + seed** (cluster com `--locale=C`, TCP em `127.0.0.1:55432`, como já foi feito para a `0001`; criar o schema `auth` mínimo com `auth.users` e `auth.uid()` lendo `request.jwt.claims`). Esperado: falha, porque `search_turns` não existe.
- [ ] **Step 3: Escrever `0003_conversations.sql`** conforme as Interfaces.
- [ ] **Step 4: Aplicar a `0003` no Postgres local e rodar as asserções de novo.** Esperado: o bloco termina sem exceção.
- [ ] **Step 5: Aplicar no projeto remoto:** `supabase db push`. Em seguida, via SQL: `select count(*) from searches s where not exists (select 1 from search_turns t where t.search_id = s.id)` → 0.
- [ ] **Step 6:** Commit `Migration 0003: turnos da conversa, artigos salvos e créditos`.

---

### Task 3: Edge Function — conversa

**Files:**
- Create: `supabase/functions/search/conversation.ts`, `supabase/functions/search/conversation.test.ts`
- Modify: `supabase/functions/search/prompts.ts`, `supabase/functions/search/index.ts`

**Interfaces:**
- Consumes: tabelas da Task 2.
- Produces (`conversation.ts`, sem APIs do Deno, testável pelo Vitest):
  - `type RouterDecision = { action: "search" | "reuse"; standaloneQuestion: string; pubmedQuery: string | null }`
  - `parseRouterReply(text: string, originalQuestion: string): RouterDecision`
  - `type HistoryTurn = { question: string; standaloneQuestion: string | null; answerMd: string | null }`
  - `buildHistory(turns: HistoryTurn[]): string`: últimos 6, resposta cortada em 1.500 caracteres com "…", remove `[n]` e a nota final.
  - `type KnownArticle = { pmid: string; cited: boolean; turnPosition: number }`
  - `selectReuseArticles(known: KnownArticle[], max = 12): string[]`: PMIDs sem repetição; citados primeiro, depois os mais recentes.
- Produces (contrato HTTP de `search`):
  - Corpo: `{ question: string; dateRange?: "1y" | "5y" | "all"; searchId?: string; retryTurnId?: string }`.
  - Sucesso 200: `{ searchId, turnId, status: "done" | "no_evidence", standaloneQuestion: string | null }`.
  - Erro: `{ error: string, searchId?, turnId?, refunded: boolean }` com 400/401/402/404/409/422/500.

- [ ] **Step 1: Testes** em `conversation.test.ts`:

```ts
test("parseRouterReply lê JSON válido", () => {
  expect(parseRouterReply('{"action":"search","standaloneQuestion":"A colecistectomia na mesma internação reduz recorrência na pancreatite biliar grave?","pubmedQuery":"cholecystectomy AND severe"}', "e na grave?"))
    .toEqual({ action: "search", standaloneQuestion: "A colecistectomia na mesma internação reduz recorrência na pancreatite biliar grave?", pubmedQuery: "cholecystectomy AND severe" });
});
test("parseRouterReply aceita JSON dentro de cerca ```json", …);
test("parseRouterReply cai para search com a pergunta original quando não é JSON", () => {
  expect(parseRouterReply("não sei", "e na grave?")).toEqual({ action: "search", standaloneQuestion: "e na grave?", pubmedQuery: null });
});
test("parseRouterReply trata action desconhecida como search", …);
test("parseRouterReply: reuse ignora pubmedQuery", …); // pubmedQuery → null
test("buildHistory guarda só os 6 últimos turnos", …);   // 8 turnos → começa no turno 3
test("buildHistory corta resposta em 1500 caracteres e tira [n] e a nota final", …);
test("selectReuseArticles prioriza citados, sem repetir PMID, máximo 12", …);
```

- [ ] **Step 2:** `pnpm test` → FAIL (módulo inexistente).
- [ ] **Step 3: Implementar `conversation.ts`.** Quando `action = "search"` e `pubmedQuery` vier vazio, o `index.ts` gera a busca com `CALLS.query` a partir de `standaloneQuestion`.
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5: `prompts.ts`:** `SYSTEM_ROUTER` (responde só JSON `{action, standaloneQuestion, pubmedQuery}`; `reuse` quando a dúvida é sobre os artigos/resposta já mostrados; `search` quando muda população, intervenção, desfecho ou pede algo não coberto; `standaloneQuestion` em português, completa, sem pronomes que dependam do contexto; `pubmedQuery` com as mesmas regras de `SYSTEM_QUERY`). A síntese recebe, antes dos artigos, um bloco `CONVERSA ATÉ AQUI:` (de `buildHistory`) e a instrução de que o histórico serve só de contexto e as citações valem só para a lista numerada atual.
- [ ] **Step 6: `index.ts`:**
  - Sem `searchId`: cria `searches` (`question`, `date_range`) e o turno 1; fluxo atual de busca.
  - Com `searchId`: carrega a conversa com service role e confere `user_id`, senão 404 "Pesquisa não encontrada."; turno `pending` existente → 409 "Aguarde a resposta anterior."; 20 turnos não-`error` → 409 com a mensagem do limite; debita crédito (402 se acabou); insere turno com `position = max + 1` (conflito de `unique` → 409 "Aguarde a resposta anterior."); roteia; `reuse` sem artigos conhecidos → `search`.
  - `retryTurnId`: o turno precisa ser `error` e da conversa; é apagado e o novo turno ocupa a mesma `position`.
  - `reuse`: as fontes do turno são cópias das linhas de `sources` dos PMIDs escolhidos (com o `summary_pt` existente), renumeradas 1..n; não chama esearch, efetch nem o resumo.
  - `efetch` extrai `pmcid` (`<ArticleId IdType="pmc">`) e `doi` (`<ArticleId IdType="doi">`) do bloco `PubmedData`.
  - `markFailed` grava `status = 'error'` no **turno** e chama `refund_credit`; a resposta de erro leva `refunded: true`.
  - Toda escrita bem-sucedida atualiza `searches.updated_at = now()`.
  - Durante a transição, continua gravando `status`, `answer_md`, `pubmed_query` e `error` em `searches` quando o turno é o 1 (as colunas saem na Task 8).
- [ ] **Step 7: Deploy** `supabase functions deploy search --project-ref oafkipjrgpgehusvubad`. Teste por SQL e logs, sem login no navegador: `select status, error from search_turns order by created_at desc limit 3` depois que o usuário fizer uma pesquisa (pedir a ele no fim da Task 5).
- [ ] **Step 8:** Commit `Função search: conversa com roteador, turnos e devolução de crédito`.

---

### Task 4: Front — tipos e camada de dados da conversa

**Files:**
- Modify: `src/types/search.ts`, `src/types/article.ts`, `src/lib/question.ts`, `src/lib/data/guards.ts`, `src/lib/vancouver.ts`, `src/lib/mocks/searches.ts`
- Rename+modify: `src/lib/data/searches.ts` → `src/lib/data/conversations.ts`
- Modify: `src/app/(app)/pesquisa/actions.ts`, `src/app/(app)/layout.tsx`, `src/app/(app)/historico/page.tsx`
- Create: `src/lib/question.test.ts`, `src/lib/data/guards.test.ts`

**Interfaces:**
- Produces (tipos):

```ts
// src/types/search.ts
export interface Turn {
  id: string;
  position: number;
  question: string;
  /** Como o Lúmen entendeu a pergunta; null na primeira. */
  standaloneQuestion: string | null;
  status: SearchStatus;
  answerMd: string;
  sources: Article[];
  createdAt: string;
}
export interface Conversation {
  id: string;
  title: string;        // primeira pergunta
  dateRange: DateRange;
  createdAt: string;
  updatedAt: string;
  turns: Turn[];        // ordem de position
}
export type SearchSummary = { id: string; question: string; status: SearchStatus; updatedAt: string };
export const MAX_TURNS = 20;
// src/types/article.ts: Article ganha pmcid?: string; doi?: string
```

- Produces (dados, `src/lib/data/conversations.ts`, `server-only`):
  - `listConversations(limit?: number): Promise<SearchSummary[]>`: ordenado por `updated_at desc`; `status` do último turno.
  - `getConversation(id: string): Promise<Conversation | null>`: um select com `search_turns (…, sources (…))`.
  - `getTurn(turnId: string): Promise<{ conversation: Conversation; turn: Turn } | null>`: para a impressão.
  - `type RunResult = { ok: true; id: string; turnId: string } | { ok: false; error: string }`
  - `createConversation(question: string, dateRange: DateRange): Promise<RunResult>`
  - `continueConversation(searchId: string, question: string, retryTurnId?: string): Promise<RunResult>`
  - Modo demonstração: o cookie `lumen-demo-pesquisas` passa a guardar `{ id, dateRange, createdAt, updatedAt, turns: { id, question, resultKey, createdAt }[] }` (referências aos mocks, não o conteúdo). Continuações em demonstração usam `mockResultKeyFor(question)` e `standaloneQuestion = question`.
- Produces (`src/lib/question.ts`): `validateQuestion(text: string, opts: { followUp: boolean }): string | null` (mínimo, máximo e `findPatientIdentifier`, mensagens atuais).
- Produces (`src/lib/vancouver.ts`): `buildCopyText(title: string, turn: Turn): string` (usa `turn.standaloneQuestion ?? title` como "Pergunta:").
- Produces (actions): `startSearch(question, dateRange): Promise<RunResult>`, `continueSearch(searchId, question): Promise<RunResult>`, `retryTurn(searchId, turnId): Promise<RunResult>`; todas chamam `revalidatePath("/", "layout")`.
- `guards.ts`: `sourceRowToArticle` lê `pmcid` e `doi`.

- [ ] **Step 1: Testes:**
  - `question.test.ts` (assinatura `validateQuestion(text: string, opts: { followUp: boolean }): string | null`; continuações curtas são válidas, mínimo 3 caracteres; primeira pergunta mantém o mínimo 10):
    - `validateQuestion("e na grave?", { followUp: true })` → `null`;
    - `validateQuestion("e na grave?", { followUp: false })` → `"Escreva a pergunta com um pouco mais de detalhe."`;
    - `validateQuestion("ok", { followUp: true })` → a mesma mensagem;
    - `validateQuestion("paciente CPF 123.456.789-00, e na grave?", { followUp: true })` → a mensagem atual de `findPatientIdentifier`.
  - `guards.test.ts`: `sourceRowToArticle` com `pmcid: "PMC123"` e `doi: "10.1/x"` → os campos aparecem no `Article`; com `null` → `undefined`.
- [ ] **Step 2:** `pnpm test` → FAIL.
- [ ] **Step 3: Implementar** tipos, `validateQuestion`, `guards`, `vancouver`, `conversations.ts`, actions. Ajustar `layout.tsx` (`listConversations(20)`) e `historico/page.tsx` (`updatedAt`). Atualizar os usos de `buildCopyText` e `Search` até `pnpm exec tsc --noEmit` passar; `result-view.tsx` pode ficar temporariamente mostrando só `turns[0]` até a Task 5.
- [ ] **Step 4:** `pnpm test`, `pnpm lint`, `pnpm build` → PASS.
- [ ] **Step 5:** Commit `Front lê conversas com turnos`.

---

### Task 5: Tela da conversa (layout B), continuação e "Tentar de novo"

**Files:**
- Create: `src/components/conversation/conversation-view.tsx` (client: turno selecionado, envio da continuação), `turn-block.tsx`, `follow-up-box.tsx`, `sources-panel.tsx`
- Modify: `src/app/(app)/pesquisa/[id]/page.tsx`, `src/components/search/search-progress.tsx` (aceita `steps` por prop)
- Delete: `src/components/search/result-view.tsx`

**Interfaces:**
- Consumes: `Conversation`, `Turn`, `MAX_TURNS`, `continueSearch`, `retryTurn`, `validateQuestion(…, { followUp: true })`, `buildCopyText`.
- Produces: `ConversationView({ conversation }: { conversation: Conversation })`; `TurnBlock({ turn, index, selected, onSelect, onRetry, title })`; `FollowUpBox({ disabled, onSubmit, error, limitReached })`; `SourcesPanel({ turn, highlighted })`.

Comportamento fixado pela spec:
- Desktop (`lg`): grid `minmax(0,1fr) 400px`; painel direito `sticky` com os artigos do turno selecionado (padrão: o último `done`); turno selecionado com fundo `surface-sunken` discreto; clicar no turno seleciona; passar o mouse em [n] destaca o card do painel.
- Celular: artigos de cada turno abaixo dele num `<details>` "N artigos citados".
- Pergunta do médico em balão (`lumen-tint`, alinhado à direita); abaixo, só em continuação, `text-body-sm text-ink-secondary` "Entendi: {standaloneQuestion}".
- Turno `no_evidence`/`error`/`pending`: `SearchStatusMessage` existente; `error` ganha botão secundário "Tentar de novo" que chama `retryTurn`.
- Ações por resposta `done`: `CopyButton` e link "Baixar PDF" (Task 6 cria a rota; aqui o link já aponta para `/imprimir/{turn.id}` com `target="_blank"`).
- Caixa de continuação fixa no rodapé da coluna (`sticky bottom-0`), `PatientBanner` acima dela, placeholder "Pergunte algo sobre esta pesquisa…"; desabilitada enquanto envia; ao enviar, o turno novo aparece na coluna com `SearchProgress` (etapas "Entendendo a pergunta", "Buscando ou relendo artigos", "Lendo e resumindo") até `router.refresh()`.
- Limite: quando `turns.filter(t => t.status !== "error").length >= MAX_TURNS`, a caixa dá lugar ao texto "Esta conversa chegou ao limite. Comece uma nova pesquisa." com link para `/pesquisa`.
- Depois do envio bem-sucedido, rolar até o turno novo.

- [ ] **Step 1:** Implementar os componentes e a página.
- [ ] **Step 2: Verificar em modo demonstração** (servidor com `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= pnpm dev --port 3100`): abrir `exemplo-sglt2`, enviar "e em fração de ejeção preservada?"; o turno 2 aparece com "Entendi: …", o painel troca ao clicar no turno 1, a 390px os artigos ficam abaixo de cada turno, e uma continuação com CPF mostra o erro sem criar turno.
- [ ] **Step 3:** `pnpm lint`, `pnpm test`, `pnpm build` → PASS; reiniciar o dev server em modo real.
- [ ] **Step 4:** Commit `Tela da conversa com continuação e painel de artigos`.
- [ ] **Step 5:** Pedir ao usuário uma pesquisa real + "e na grave?"; conferir `search_turns` por SQL (2 turnos, o 2º com `standalone_question` completa) e os logs da função.

---

### Task 6: PDF da resposta (versão de impressão)

**Files:**
- Create: `src/app/(print)/layout.tsx`, `src/app/(print)/imprimir/[turnId]/page.tsx`, `src/components/print/print-on-load.tsx` (client: `window.print()` após `document.fonts.ready`)
- Modify: `src/lib/auth/routes.ts` (`PROTECTED_PREFIXES` ganha `"/imprimir"`), `src/app/globals.css` (`@media print`)

**Interfaces:**
- Consumes: `getTurn(turnId)`, `formatVancouver`, `parseAnswer`/`Answer` sem interação, `CLINICAL_DECISION_NOTE`, `dateRangeLabel`, `formatDateTime`, `Logo`.
- Produces: rota `/imprimir/[turnId]` (404 se o turno não é do usuário ou não está `done`).

Conteúdo fixado pela spec: logo Lúmen; título = `turn.standaloneQuestion ?? conversation.title`; data do turno e "Publicações: {período}"; resposta com [n]; "A decisão clínica é do médico."; "Referências" numeradas em Vancouver, cada uma com o link do PubMed por extenso; sem sidebar, header, botões ou painel. A página força o tema claro (remove a classe `dark` do `<html>` ao montar e usa cores claras em `@media print`). Um botão "Salvar como PDF" visível só na tela (`print:hidden`) para o caso de o diálogo ser fechado.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2: Verificar** em demonstração: o link "Baixar PDF" do turno 2 abre a aba e o diálogo de impressão; com o modo escuro ligado, a prévia sai clara; `/imprimir/<id-inexistente>` → 404.
- [ ] **Step 3:** `pnpm lint`, `pnpm test`, `pnpm build` → PASS.
- [ ] **Step 4:** Commit `Baixar a resposta em PDF`.

---

### Task 7: Artigos salvos

**Files:**
- Create: `src/lib/data/saved.ts`, `src/lib/article-links.ts`, `src/lib/article-links.test.ts`, `src/app/(app)/salvos/page.tsx`, `src/app/(app)/salvos/actions.ts`, `src/components/articles/save-button.tsx`, `src/components/saved/saved-list.tsx`
- Modify: `src/types/article.ts`, `src/components/articles/article-card.tsx`, `src/components/conversation/sources-panel.tsx`, `src/components/app-shell/sidebar.tsx`, `src/lib/auth/routes.ts`, `src/app/(app)/pesquisa/[id]/page.tsx`

**Interfaces:**
- Produces:
  - `interface SavedArticle extends Article { savedAt: string; searchId: string | null; question: string | null }` em `src/types/article.ts`.
  - `fullTextUrl(article: Pick<Article, "pmid" | "pmcid" | "doi">): { href: string; label: "PubMed Central" | "Revista" | "PubMed" }`: PMC (`https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/`), senão `https://doi.org/{doi}`, senão `pubmedUrl(pmid)`.
  - `listSavedArticles(): Promise<SavedArticle[]>`, `getSavedPmids(): Promise<Set<string>>` (cache por requisição).
  - `toggleSaved(article: Article, searchId: string | null, save: boolean): Promise<{ ok: true; saved: boolean } | { ok: false; error: string }>` (insert com `on conflict do nothing` / delete por `pmid`; `revalidatePath("/salvos")`).
  - `SaveButton({ article, searchId, initialSaved })`: client, otimista, ícone `Bookmark`/`BookmarkCheck` (lucide), `aria-pressed`, rótulo "Salvar"/"Salvo".
  - Modo demonstração: cookie `lumen-demo-salvos` com `{ pmid, searchId, savedAt }[]`; os dados do artigo vêm de `mockResults`.
- `ArticleCard` ganha `saved?: boolean` e `searchId?: string | null` e mostra `SaveButton`; o link do card passa a usar `fullTextUrl`.
- `/salvos`: título "Artigos salvos"; "Copiar todas as referências" (lista numerada `formatVancouver`, via `CopyButton`); cada item com o card, "Veio da pergunta: {question}" (link para `/pesquisa/{searchId}` quando existir), "Copiar referência" e "Texto completo ({label})"; estado vazio "Você ainda não salvou artigos. Use o marcador nos cards de uma resposta."; ordem `savedAt desc`.
- Sidebar: item "Artigos salvos" (ícone `Bookmark`) entre "Histórico" e a conta; `PROTECTED_PREFIXES` ganha `"/salvos"`.

- [ ] **Step 1: Teste** `article-links.test.ts`: com `pmcid` → PMC; sem `pmcid` e com `doi` → `https://doi.org/10.1056/NEJMoa012512`; sem os dois → `https://pubmed.ncbi.nlm.nih.gov/11832527/`.
- [ ] **Step 2:** `pnpm test` → FAIL; implementar `article-links.ts`; `pnpm test` → PASS.
- [ ] **Step 3:** Implementar dados, action, botão, página e sidebar.
- [ ] **Step 4: Verificar** em demonstração: salvar o mesmo PMID no turno 1 e de novo noutro turno, sem duplicar; remover na página de salvos; "Copiar todas as referências" gera a lista numerada; a 390px a página não tem rolagem horizontal.
- [ ] **Step 5:** `pnpm lint`, `pnpm test`, `pnpm build` → PASS.
- [ ] **Step 6:** Commit `Artigos salvos`.

---

### Task 8: Fechamento — limpeza do schema e documentação

**Files:**
- Create: `supabase/migrations/0004_drop_legacy_search_columns.sql`
- Modify: `supabase/functions/search/index.ts` (para de gravar as colunas antigas), `CLAUDE.md`, `supabase/README.md`

**Interfaces:**
- `0004`: `alter table public.searches drop column status, drop column answer_md, drop column pubmed_query, drop column error;` e remove a unicidade antiga `(search_id, position)` de `sources` se ainda existir.

- [ ] **Step 1:** Confirmar por grep que nada em `src/` nem na função lê essas colunas de `searches`.
- [ ] **Step 2:** Tirar da função a escrita das colunas antigas; deploy da função.
- [ ] **Step 3:** `supabase db push` com a `0004`; via SQL, abrir uma conversa antiga e uma nova (`select … from searches join search_turns …`) e conferir que estão completas.
- [ ] **Step 4:** `CLAUDE.md`: mover "biblioteca pessoal de artigos salvos" de v2 para as funcionalidades; descrever a conversa contínua, o PDF da resposta e o padrão de 999 créditos; atualizar o "Modelo de dados" (`searches`, `search_turns`, `sources`, `saved_articles`); manter Semantic Scholar/arXiv como próxima etapa. `supabase/README.md`: novo contrato da função e as migrations `0003`/`0004`.
- [ ] **Step 5:** `pnpm lint`, `pnpm test`, `pnpm build` → PASS.
- [ ] **Step 6:** Commit `Remove colunas antigas de searches e atualiza a documentação`.
