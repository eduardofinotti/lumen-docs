# Lúmen · Backend (fase 2)

## O que está aqui
- `migrations/0001_init.sql`: profiles, invites (cadastro restrito), searches, sources, RLS e a função `debit_credit`.
- `functions/search/index.ts`: a Edge Function de pesquisa (pergunta → query PubMed → esearch/efetch → síntese → banco).
- `functions/search/prompts.ts`: os três prompts (gerar query, síntese, resumo por artigo).

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
7. No front, chame a função com o token do usuário logado:
   ```ts
   const { data, error } = await supabase.functions.invoke("search", {
     body: { question, dateRange: "5y" },
   });
   ```
   A resposta tem `answerMd`, `sources[]` (com `position`, `pmid`, `title`, `evidenceLabel`, `summaryPt`, `url`) e `status` (`done` | `no_evidence`).

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
