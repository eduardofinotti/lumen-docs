# Lúmen · Backend (fase 2)

## O que está aqui
- `migrations/`: schema (ver "Migrations" abaixo).
- `functions/search/index.ts`: a Edge Function de pesquisa (pergunta → roteador nas continuações → query PubMed → esearch/efetch → síntese → banco).
- `functions/search/conversation.ts`: lógica pura da conversa (roteador, histórico, artigos reaproveitados), testada com `pnpm test`.
- `functions/search/prompts.ts`: os prompts (roteador da continuação, gerar query, síntese, resumo por artigo).

## Passo a passo
1. Instale a CLI: `npm i -g supabase` e faça `supabase login`.
2. Na raiz do projeto: `supabase link --project-ref <ref do projeto>`.
3. Aplique o schema: `supabase db push` (ou cole o SQL no SQL Editor do painel).
4. Secrets da função (Edge Functions → Secrets no painel, ou por CLI):
   ```
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase secrets set NCBI_API_KEY=...
   supabase secrets set NCBI_EMAIL=seu@email.com
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem no runtime.
5. Deploy: `supabase functions deploy search`.
6. Convide o primeiro usuário (você) no SQL Editor:
   ```sql
   insert into public.invites (email, invited_by) values ('seu@email.com', 'admin');
   ```
7. No front, chame a função com o token do usuário logado (`src/lib/data/conversations.ts`):
   ```ts
   // primeira pergunta: cria a conversa
   await supabase.functions.invoke("search", { body: { question, dateRange: "5y" } });
   // continuação na mesma conversa
   await supabase.functions.invoke("search", { body: { searchId, question: "e na grave?" } });
   // tentar de novo uma pergunta que deu erro (mesma posição)
   await supabase.functions.invoke("search", { body: { searchId, retryTurnId } });
   ```
   Sucesso: `{ searchId, turnId, status: "done" | "no_evidence", standaloneQuestion }`.
   Erro: `{ error, searchId?, turnId?, refunded }`. Com `turnId`, a pergunta virou um turno
   com erro e o crédito foi devolvido. Sem `turnId`, nada foi cobrado (401, 402 sem crédito,
   404, 409 com outra pergunta em andamento ou com o limite de 20).
   A resposta e os artigos ficam em `search_turns` e `sources`; o front lê de lá.

## Migrations
- `0001_init.sql`: profiles, invites, searches, sources, RLS, `debit_credit`.
- `0002_sources_citation.sql`: volume, número e páginas nas fontes (Vancouver).
- `0003_conversations.sql`: `search_turns` (cada pergunta da conversa), `saved_articles`,
  `refund_credit`, créditos 999; converte cada pesquisa antiga no turno 1.
- `0004_drop_legacy_search_columns.sql`: tira de `searches` as colunas que foram para os
  turnos. Aplicar só depois da função nova publicada.

Teste local das migrations (Postgres descartável, sem Docker):
```
PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres supabase/tests/run.sh
```

## Teste rápido por curl (depois do deploy)
```
curl -X POST "https://<ref>.supabase.co/functions/v1/search" \
  -H "Authorization: Bearer <access_token do usuário>" \
  -H "Content-Type: application/json" \
  -d '{"question":"Metformina reduz risco cardiovascular em DM2?","dateRange":"5y"}'
```

## Ajustes esperados
- `MODEL` em `index.ts`: confirme o nome do modelo Claude disponível na sua conta.
- Tempo: uma pesquisa leva 10 a 25 s (duas chamadas ao Claude mais os resumos em paralelo). O front mostra as etapas.
- Custo: por pesquisa, poucos centavos de dólar. Para reduzir, gere os resumos por artigo só ao expandir o card (segunda função) em vez de sempre.
- O parser do XML do PubMed é por regex, suficiente para a v1. Se aparecer artigo sem título ou autor, é a hora de trocar por um parser XML.
