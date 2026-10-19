# Lúmen — Pesquisa científica em português para médicos

## O que é
Plataforma web onde médicos fazem perguntas clínicas em português e recebem
respostas baseadas em artigos científicos reais, resumidas em português, com link
para cada artigo. Nunca inventa referência.
Fonte na v1: PubMed. Semantic Scholar e arXiv entram depois, no mesmo fluxo.
Público: médicos brasileiros com pouca familiaridade com tecnologia.
Toda a interface em português do Brasil.
Cadastro restrito por enquanto: só entra quem tiver convite (lista de e-mails
autorizados ou código de convite); a landing não oferece cadastro aberto.

## Funcionalidades (v1)
Produto principal
1. Pergunta em português → a IA gera a busca técnica em inglês (termos MeSH,
   filtros) → busca no PubMed → síntese em português citando só os artigos
   encontrados. Se a evidência for insuficiente, a resposta diz isso.
2. Resposta com citações numeradas [1] [2] apontando para artigos reais (PMID).
3. Nível de evidência visível por artigo: revisão sistemática, ensaio clínico
   randomizado, coorte, caso-controle, relato de caso, diretriz, outro.
4. Resumo de cada artigo em português (pergunta, método, resultado, limitação)
   e link para o original no PubMed.
5. Filtro de data simples: último ano / últimos 5 anos / qualquer data.
Entorno
6. Histórico de pesquisas do usuário, reabrível.
7. Copiar resposta com referências em formato Vancouver.
8. Três perguntas sugeridas por especialidade na tela inicial.
9. Conversa contínua: depois da primeira resposta, o médico continua perguntando
   no mesmo contexto ("e na grave?"). O Lúmen reescreve a pergunta completa
   (mostra "Entendi: …") e decide entre busca nova e reaproveitar os artigos já
   encontrados. Até 20 perguntas por conversa; 1 crédito por pergunta, devolvido
   se a pergunta falhar ("Tentar de novo").
10. Artigos salvos: lista única (/salvos), com referência Vancouver para copiar
    e link para o texto completo (PubMed Central, revista ou PubMed).
11. Baixar uma resposta em PDF (/imprimir/[turnId], "Salvar como PDF" do navegador).
12. Pensado para o celular (onde mais se usa): alvos de toque de 44px, campos com 16px
    (sem zoom no iPhone). Instalável como app (PWA): `app/manifest.ts`, ícones em
    `public/icons/` e `app/apple-icon.png`, `public/sw.js` (só a tela /offline; não guarda dados do médico) e
    a seção "Usar como app" em /conta.
Regras fixas da síntese: nunca dar conduta; sempre terminar lembrando que a
decisão clínica é do médico; só citar PMIDs recebidos da busca.
Próxima etapa: Semantic Scholar e arXiv.
v2 (não fazer agora): alertas de novos artigos, comparar dois artigos, pastas
de artigos salvos.

## Referência de layout
Prints em `docs/referencias/` (consensus-home.png, consensus-login.png).
Copiar a ESTRUTURA, não o visual:
- Tela principal: caixa de pergunta como único elemento central, com o logo e
  uma frase curta acima; sugestões de ação logo abaixo da caixa.
- Sidebar esquerda recolhível: "Nova pesquisa", "Início", e o histórico de
  perguntas (visível só logado).
- Login numa tela só: e-mail + senha. Sem Google nem Apple (só convidados entram).
O que NÃO copiar: tema escuro por padrão (usar o tema claro definido abaixo;
modo escuro opcional), controles de pesquisador ("Skills", "Deep", "Filter"):
no lugar, um único seletor de data. Sugestões abaixo da caixa são perguntas
clínicas reais da especialidade do usuário, não ações genéricas.

## Fase atual: FRONT-END
Nesta fase construímos apenas: landing page, cadastro, login, recuperação de senha
e a tela de pesquisa com dados mockados. O backend de busca (Edge Functions,
APIs externas, Claude) vem depois. Não implemente busca real agora.
Quando o Supabase ainda não estiver configurado, o app deve rodar com
NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY vazios sem quebrar
(mostrar aviso no console e usar mocks).

## Stack (não trocar)
- Next.js 15 (App Router, TypeScript, `src/` dir)
- Tailwind CSS + shadcn/ui
- Supabase (`@supabase/ssr`) para Auth e banco
- Deploy na Vercel
- Gerenciador: pnpm

## Estrutura de pastas
src/app/(marketing)/page.tsx          landing
src/app/(auth)/entrar/page.tsx        login
src/app/(auth)/cadastro/page.tsx      cadastro
src/app/(auth)/recuperar-senha/       recuperação
src/app/(app)/pesquisa/page.tsx       tela principal (protegida)
src/app/(app)/pesquisa/[id]/page.tsx  resultado de uma pesquisa
src/app/(app)/historico/page.tsx      histórico do usuário
src/app/(app)/conta/page.tsx          perfil e créditos
src/app/(app)/salvos/page.tsx         artigos salvos
src/app/(print)/imprimir/[turnId]/    PDF de uma resposta (sem o shell do app)
src/components/                       componentes por domínio
src/lib/supabase/{client,server,middleware}.ts
src/lib/mocks/                        dados fictícios da fase de front
src/types/

## Autenticação
- E-mail e senha via Supabase Auth. Confirmação de e-mail habilitada.
- Rotas em (app) protegidas por middleware; sem sessão redireciona para /entrar.
- Cadastro pede: nome completo, e-mail, senha, especialidade (select), CRM + UF (opcional).
- Após cadastro, cria linha em `profiles` (trigger no Supabase, não no front).

## Modelo de dados (Supabase) — criar migrations em `supabase/migrations`
profiles: id (uuid, FK auth.users), full_name, specialty, crm, crm_uf, credits int default 999, created_at
searches (a conversa): id, user_id, question (primeira pergunta), date_range, created_at, updated_at
search_turns (cada pergunta): id, search_id, position, question, standalone_question,
          action (search|reuse), status (pending|done|error|no_evidence), answer_md, pubmed_query, error
sources (artigos de cada resposta): turn_id, search_id, position ([n]), pmid, título, autores,
          periódico, ano, volume, número, páginas, pmcid, doi, nível de evidência, resumo_pt
saved_articles: user_id, pmid (único por usuário), cópia dos dados do artigo, search_id
invites: e-mail autorizado ou código de uso único
Habilitar RLS: usuário só lê/escreve as próprias linhas; turnos e fontes só a Edge Function escreve.
Créditos: 999 por conta enquanto não há preço.

## Design — identidade Lúmen
O design system está em `docs/design-system/` (tokens.json, README.md e logos).
Leia `docs/design-system/README.md` antes de qualquer tela; ele é a fonte da
verdade para cor, tipografia, espaçamento, componentes e voz. Resumo:
- Nome do produto: Lúmen (com acento). Tagline: "Evidência científica, em
  português, em segundos."
- Fontes (next/font/google): Fraunces 500 para títulos (display), Geist 400/500
  para tudo o mais, Geist Mono para PMID e prompts.
- Cores: tokens de `docs/design-system/tokens.json` mapeados em CSS variables e
  no tailwind.config (surface, surface-raised, ink, ink-secondary, line, lumen,
  lumen-hover, lumen-tint, on-lumen, evidence-high/mid/low, danger). Tema claro
  por padrão; modo escuro com os valores "dark" do tokens.json.
- O laranja `lumen` (#FF6A1A) só em: botão primário, números de citação [n],
  ícone ativo, anel de foco. Texto sobre laranja é sempre `on-lumen` (escuro).
- Logo: `docs/design-system/logos/`. Na interface, usar o símbolo (`lumen-mark.svg`)
  como <img> + o nome "Lúmen" em HTML (Fraunces 500), nunca o wordmark SVG com
  texto. Favicon: `lumen-app-icon.svg`.
- Estética: minimalista, editorial, muito espaço em branco; cards com borda 1px
  `line` e radius 16px; a única sombra é a da caixa de pergunta em repouso.
  Sem gradientes, sem ícones decorativos, sem emoji.
- Acessibilidade: contraste AA, foco visível (shadow-focus), labels em todos os inputs.
- Componentes de referência (layout e regras): Botão, Caixa de pergunta,
  Citação + card de artigo, descritos no README do design system.

## Landing page (conteúdo)
1. Hero: logo Lúmen e título em Fraunces: "Evidência científica, em português,
   em segundos." Subtítulo: pergunte como falaria com um colega e receba a resposta
   com os artigos reais que a sustentam. CTA primário "Criar conta" e secundário
   "Entrar". Abaixo, um mock da caixa de pergunta com uma pergunta clínica exemplo.
2. "Como funciona": 3 passos (pergunte em português → buscamos no PubMed →
   você recebe o resumo com cada artigo linkado).
3. Confiança: bloco explicando que a resposta só cita artigos encontrados na busca;
   nunca inventa referência; cada afirmação tem link para a fonte.
4. Fontes: nome do PubMed em cinza ("em breve: Semantic Scholar e arXiv").
5. Privacidade: aviso de que a plataforma não é lugar para dados de pacientes
   (LGPD), e que não se destina a substituir julgamento clínico.
6. Rodapé simples: nome, ano, links de Termos e Privacidade (páginas placeholder).
Sem depoimentos falsos, sem números inventados, sem preço nesta fase.

## Tela de pesquisa
- Caixa de texto grande e centralizada, placeholder com exemplo de pergunta clínica.
- Abaixo, 3 sugestões de perguntas clicáveis (mock).
- Ao enviar: estado de carregamento com etapas ("Entendendo a pergunta",
  "Buscando artigos", "Lendo e resumindo") e depois o resultado mockado.
- Resultado: resposta em markdown com citações numeradas [1], [2]; lista de
  artigos à direita (desktop) ou abaixo (mobile) com título, autores, periódico,
  ano, fonte (PubMed), etiqueta de nível de evidência e link externo.
- Seletor de data ao lado da caixa: último ano / últimos 5 anos / qualquer data.
- Banner discreto e permanente acima da caixa: "Não insira nome, CPF ou qualquer
  dado que identifique um paciente."
- Créditos restantes visíveis no cabeçalho.

## Regras de código
- Componentes pequenos, server components por padrão, `"use client"` só quando preciso.
- Nada de `any`. Tipos em `src/types`.
- Textos de interface em pt-BR, sem inglês misturado.
- Commits pequenos e descritivos. Rodar `pnpm lint` e `pnpm build` antes de finalizar.
- Não instalar bibliotecas além das listadas sem justificar.

## Fase 2: backend (quando o front estiver pronto)
O backend já está escrito em `supabase/` (migration, Edge Function `search` e
prompts). Leia `supabase/README.md`. Ao ligar o front:
- Trocar os mocks pela chamada `supabase.functions.invoke("search", { body })`.
- Corpo `{ question, dateRange }` (primeira pergunta) ou `{ searchId, question }`
  (continuação) ou `{ searchId, retryTurnId }` (tentar de novo); a resposta traz
  `searchId`, `turnId` e `status`. `no_evidence` mostra a mensagem "Não
  encontramos artigos para essa pergunta" com sugestão de ampliar.
- Cadastro restrito: o trigger recusa e-mail sem linha em `invites`; a tela de
  cadastro mostra "Cadastro por convite. Fale com a mentoria." nesse erro.

## Fora de escopo agora (não fazer)
- Semantic Scholar e arXiv
- Pagamento e compra de créditos
- Painel admin
