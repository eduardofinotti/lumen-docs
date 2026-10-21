// Lúmen · Edge Function `search`
// Uma pesquisa é uma conversa (`searches`) com turnos (`search_turns`); cada turno tem suas fontes.
// Primeira pergunta: query PubMed (Claude) → esearch (geral + diretrizes brasileiras) + preprints do medRxiv
// (Europe PMC) → efetch → síntese (Claude) → banco.
// Continuação: o roteador (Claude) reescreve a pergunta e decide entre busca nova e reaproveitar
// os artigos já encontrados; depois segue o mesmo caminho.
// Relatos de caso ({ searchId, caseReportsTurnId }): busca só "Case Reports" no tema da resposta, sem síntese.
// Deploy: supabase functions deploy search
// Secrets: ANTHROPIC_API_KEY, NCBI_API_KEY, NCBI_EMAIL (SUPABASE_URL e SERVICE_ROLE já existem no runtime)

import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.131.0";
import { decodeEntities, isRetracted, publicationTypesOf, splitConclusion, titleOf, type EvidenceStrength } from "./answer.ts";
import { brazilianGuidelineQuery, guidelineDays, isBrazilianGuideline, mergeWithGuidelines } from "./guidelines.ts";
import { caseReportQuery, topicQueryFor } from "./case-reports.ts";
import { parsePreprint, preprintDays, readEuropePmcResponse, toEuropePmcQuery, withPreprints, type Preprint } from "./preprints.ts";
import { buildHistory, isStalePending, parseRouterReply, selectReuseArticles, type RouterDecision } from "./conversation.ts";
import { CONVERSATION_NOTE, SYSTEM_QUERY, SYSTEM_ROUTER, SYSTEM_SUMMARY, SYSTEM_SYNTHESIS } from "./prompts.ts";

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const EUROPE_PMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const MODEL = "claude-sonnet-5-5";
const MAX_ARTICLES = 12;
const MAX_TURNS = 20;
const MAX_CASE_REPORTS = 6;
const BR_GUIDELINE = "Diretriz brasileira";

// Claude Sonnet 5.5 pensa por padrão (thinking adaptativo) e esse raciocínio conta no max_tokens,
// por isso os limites têm folga. O esforço controla quanto ele pensa: baixo para tarefas curtas
// (rotear, gerar a busca, resumir um artigo) e médio para a síntese, onde seguir as regras de citação pesa mais.
type Effort = "low" | "medium";
const CALLS = {
  router: { system: SYSTEM_ROUTER, effort: "low", maxTokens: 4000 },
  query: { system: SYSTEM_QUERY, effort: "low", maxTokens: 4000 },
  synthesis: { system: SYSTEM_SYNTHESIS, effort: "medium", maxTokens: 16000 },
  summary: { system: SYSTEM_SUMMARY, effort: "low", maxTokens: 4000 },
} satisfies Record<string, { system: string; effort: Effort; maxTokens: number }>;

/** O modelo recusou a resposta por política de segurança (stop_reason "refusal"). */
class RefusalError extends Error {}

/** Erro com resposta HTTP própria (sem crédito, conversa ocupada, limite…). Nada foi cobrado. */
class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const BUSY = "Aguarde a resposta anterior.";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DateRange = "1y" | "5y" | "all";

type Article = {
  pmid: string; title: string; authors: string; journal: string; year: number | null;
  volume: string | null; issue: string | null; pages: string | null;
  pmcid: string | null; doi: string | null;
  publicationTypes: string[]; abstract: string; url: string;
  evidenceLevel: "high" | "mid" | "low"; evidenceLabel: string;
  /** Retratado no PubMed: aparece com aviso e não vale como evidência na síntese. */
  retracted: boolean;
  /** Resumo em português já gerado (artigo que apareceu antes na conversa). */
  summaryPt?: string | null;
};

type TurnRow = {
  id: string; position: number; question: string; standalone_question: string | null;
  status: string; answer_md: string | null; created_at: string;
};

type SourceRow = {
  pmid: string; title: string; authors: string | null; journal: string | null; year: number | null;
  volume: string | null; issue: string | null; pages: string | null; pmcid: string | null; doi: string | null;
  publication_types: string[] | null; evidence_level: string | null; evidence_label: string | null;
  abstract: string | null; summary_pt: string | null; url: string | null; position: number; turn_id: string;
  retracted: boolean | null;
};

type Body = { question?: string; dateRange?: DateRange; searchId?: string; retryTurnId?: string; caseReportsTurnId?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Preenchidos quando o turno é criado; usados no catch para marcá-lo como erro e devolver o crédito.
  let searchId: string | null = null;
  let turnId: string | null = null;
  let markFailed: ((reason: string) => Promise<void>) | null = null;

  try {
    // 1. Autenticação ------------------------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return json({ error: "Não autenticado.", refunded: false }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const debit = async () => {
      const { data: ok } = await admin.rpc("debit_credit", { p_user: user.id });
      if (!ok) throw new HttpError(402, "Seus créditos acabaram.");
    };
    const refund = () => admin.rpc("refund_credit", { p_user: user.id });

    const body = await req.json() as Body;
    const followUp = Boolean(body.searchId);
    if (body.caseReportsTurnId) {
      return await findCaseReports(admin, user.id, body.searchId ?? "", body.caseReportsTurnId, debit, refund);
    }

    // 2. Conversa e turno ----------------------------------------------------
    let dateRange: DateRange = body.dateRange ?? "5y";
    let question = (body.question ?? "").trim();
    let previous: TurnRow[] = [];
    let position = 1;

    if (!followUp) {
      if (question.length < 8) throw new HttpError(400, "Escreva uma pergunta mais completa.");
      await debit();
      const { data: search, error } = await admin.from("searches")
        .insert({ user_id: user.id, question, date_range: dateRange }).select("id").single();
      if (error || !search) {
        await refund();
        throw new Error(`não criou a conversa: ${error?.message}`);
      }
      searchId = search.id as string;
    } else {
      const { data: search } = await admin.from("searches")
        .select("id, date_range").eq("id", body.searchId!).eq("user_id", user.id).maybeSingle();
      if (!search) throw new HttpError(404, "Pesquisa não encontrada.");
      searchId = search.id as string;
      dateRange = (search.date_range ?? "5y") as DateRange;

      const { data: turns } = await admin.from("search_turns")
        .select("id, position, question, standalone_question, status, answer_md, created_at")
        .eq("search_id", searchId).order("position");
      previous = (turns ?? []) as TurnRow[];

      // Turno "pending" há muito tempo foi interrompido (a função caiu antes do catch):
      // vira erro, devolve o crédito e deixa a conversa seguir.
      for (const stale of previous.filter((t) => isStalePending(t.status, t.created_at))) {
        const { data: marked } = await admin.from("search_turns")
          .update({ status: "error", error: "interrompido (tempo esgotado)" })
          .eq("id", stale.id).eq("status", "pending").select("id");
        if (marked?.length) await refund();
        stale.status = "error";
      }

      let retrying: TurnRow | undefined;
      if (body.retryTurnId) {
        retrying = previous.find((t) => t.id === body.retryTurnId && t.status === "error");
        if (!retrying) throw new HttpError(400, "Não foi possível refazer esta pergunta.");
        question = retrying.question;
        position = retrying.position;
        previous = previous.filter((t) => t.id !== retrying!.id);
      } else {
        if (question.length < 3) throw new HttpError(400, "Escreva a pergunta com um pouco mais de detalhe.");
        position = Math.max(0, ...previous.map((t) => t.position)) + 1;
      }
      if (previous.some((t) => t.status === "pending")) throw new HttpError(409, BUSY);
      if (previous.filter((t) => t.status !== "error").length >= MAX_TURNS) {
        throw new HttpError(409, "Esta conversa chegou ao limite. Comece uma nova pesquisa.");
      }
      await debit();
      if (retrying) await admin.from("search_turns").delete().eq("id", retrying.id);
    }

    const { data: turn, error: turnErr } = await admin.from("search_turns")
      .insert({ search_id: searchId, position, question }).select("id").single();
    if (turnErr || !turn) {
      await refund();
      // Na primeira pergunta, não deixa uma conversa vazia no histórico.
      if (!followUp) await admin.from("searches").delete().eq("id", searchId);
      // Posição repetida: outra pergunta desta conversa acabou de entrar.
      if (turnErr?.code === "23505") throw new HttpError(409, BUSY);
      throw new Error(`não criou o turno: ${turnErr?.message}`);
    }
    const id = turn.id as string;
    const sid = searchId;
    turnId = id;
    markFailed = async (reason) => {
      await admin.from("search_turns").update({ status: "error", error: reason }).eq("id", id);
      await refund();
    };
    /** Grava o turno e marca a atividade da conversa. */
    const saveTurn = async (fields: {
      status: string; answer_md?: string; pubmed_query: string | null; guidelines_searched?: boolean | null;
      conclusion?: string | null; evidence_strength?: EvidenceStrength | null; evidence_reason?: string | null;
    }) => {
      await admin.from("search_turns").update(fields).eq("id", id);
      await admin.from("searches").update({ updated_at: new Date().toISOString() }).eq("id", sid);
    };

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    // 3. Roteamento (só nas continuações) -------------------------------------
    let known: SourceRow[] = [];
    let decision: RouterDecision = { action: "search", standaloneQuestion: question, pubmedQuery: null };
    const history = buildHistory(previous.map((t) => ({
      question: t.question, standaloneQuestion: t.standalone_question, answerMd: t.answer_md,
    })));

    if (followUp) {
      const { data: rows } = await admin.from("sources")
        .select("pmid, title, authors, journal, year, volume, issue, pages, pmcid, doi, publication_types, evidence_level, evidence_label, abstract, summary_pt, url, position, turn_id, retracted")
        .eq("search_id", sid);
      const turnIds = new Set(previous.map((t) => t.id));
      known = ((rows ?? []) as SourceRow[]).filter((r) => turnIds.has(r.turn_id));
      const articleList = [...new Map(known.map((r) => [r.pmid, r])).values()]
        .map((r) => `PMID ${r.pmid} · ${r.title} · ${(r.publication_types ?? []).join(", ")}`).join("\n");
      decision = parseRouterReply(
        await ask(anthropic, CALLS.router,
          `CONVERSA ATÉ AQUI:\n${history}\n\nARTIGOS JÁ ENCONTRADOS:\n${articleList || "(nenhum)"}\n\nNOVA MENSAGEM DO MÉDICO:\n${question}`),
        question,
      );
      if (decision.action === "reuse" && known.length === 0) decision = { ...decision, action: "search" };
      await admin.from("search_turns")
        .update({ standalone_question: decision.standaloneQuestion, action: decision.action }).eq("id", id);
    } else {
      await admin.from("search_turns").update({ action: "search" }).eq("id", id);
    }
    const standalone = decision.standaloneQuestion;
    const shownStandalone = followUp ? standalone : null;

    // 4. Artigos: busca nova ou reaproveitados --------------------------------
    let articles: Article[];
    let pubmedQuery: string | null = null;
    let guidelinesSearched: boolean | null = null;

    if (decision.action === "search") {
      pubmedQuery = decision.pubmedQuery ?? await ask(anthropic, CALLS.query, standalone);
      // Buscas extras (diretrizes brasileiras e preprints); se uma falhar, segue com a geral.
      const [generalIds, guidelineIds, preprints] = await Promise.all([
        esearch(pubmedQuery, rangeDays(dateRange), MAX_ARTICLES),
        esearch(brazilianGuidelineQuery(pubmedQuery), guidelineDays(dateRange), 6).then((ids) => {
          guidelinesSearched = true;
          return ids;
        }, (e) => {
          console.error("busca de diretrizes brasileiras falhou", e);
          return [] as string[];
        }),
        searchPreprints(toEuropePmcQuery(pubmedQuery, preprintDays(dateRange))).catch((e) => {
          console.error("busca de preprints falhou", e);
          return [] as Preprint[];
        }),
      ]);
      const pmids = [...new Set([...guidelineIds, ...generalIds])];
      if (pmids.length === 0 && preprints.length === 0) {
        await saveTurn({ status: "no_evidence", pubmed_query: pubmedQuery });
        return json({ searchId: sid, turnId: id, status: "no_evidence", standaloneQuestion: shownStandalone });
      }
      // Artigo que já apareceu na conversa reaproveita o resumo em português.
      const knownSummaries = new Map(known.filter((r) => r.summary_pt).map((r) => [r.pmid, r.summary_pt]));
      const fetched = new Map<string, Article>((pmids.length > 0 ? await efetch(pmids) : [])
        .map((a) => [a.pmid, { ...a, summaryPt: knownSummaries.get(a.pmid) ?? null }]));
      const pick = (ids: string[]) => ids.map((p) => fetched.get(p)).filter((a): a is Article => a !== undefined);
      // A busca de diretrizes traz candidatos; só fica no topo o que é de fato diretriz brasileira.
      const reviewed = mergeWithGuidelines(pick(guidelineIds).filter((a) => a.evidenceLabel === BR_GUIDELINE), pick(generalIds), MAX_ARTICLES);
      articles = withPreprints(reviewed, preprints.map((p) => ({ ...p, summaryPt: knownSummaries.get(p.pmid) ?? null })), MAX_ARTICLES);
    } else {
      const turnsById = new Map(previous.map((t) => [t.id, t]));
      const pmids = selectReuseArticles(known.map((r) => {
        const t = turnsById.get(r.turn_id);
        return { pmid: r.pmid, cited: Boolean(t?.answer_md?.includes(`[${r.position}]`)), turnPosition: t?.position ?? 0 };
      }));
      const byPmid = new Map(known.map((r) => [r.pmid, r]));
      articles = pmids.map((pmid) => rowToArticle(byPmid.get(pmid)!));
    }

    // 5. Síntese em português ---------------------------------------------
    const context = articles.map((a, i) =>
      `[${i + 1}] PMID ${a.pmid}${a.retracted ? "\nATENÇÃO: ARTIGO RETRATADO" : ""}\nTítulo: ${a.title}\nTipo: ${a.evidenceLabel === BR_GUIDELINE ? "DIRETRIZ BRASILEIRA; " : a.evidenceLabel === "Preprint" ? "PREPRINT SEM REVISÃO POR PARES; " : ""}${a.publicationTypes.join(", ")}\nPeriódico/ano: ${a.journal} ${a.year ?? ""}\nResumo: ${a.abstract || "(sem resumo)"}`
    ).join("\n\n");

    const synthesis = await ask(anthropic, CALLS.synthesis,
      (followUp ? `${CONVERSATION_NOTE}\n\nCONVERSA ATÉ AQUI:\n${history}\n\n` : "") +
      `PERGUNTA DO MÉDICO:\n${standalone}\n\nARTIGOS ENCONTRADOS:\n${context}`);
    // As duas primeiras linhas (conclusão e força da evidência) vão para colunas próprias.
    const { conclusion, strength, reason, body: answerMd } = splitConclusion(synthesis);

    // 6. Resumo em português de cada artigo novo (em paralelo, curto) ------
    // Um resumo que falha (inclusive por recusa) não derruba a pesquisa: o card fica sem resumo.
    const summaries = await Promise.all(articles.map((a) => a.summaryPt ? a.summaryPt : summarize(anthropic, a)));

    // 7. Persistência --------------------------------------------------------
    const { error: sourcesErr } = await admin.from("sources").insert(articles.map((a, i) => ({
      search_id: sid, turn_id: id, position: i + 1, pmid: a.pmid, title: a.title, authors: a.authors,
      journal: a.journal, year: a.year, volume: a.volume, issue: a.issue, pages: a.pages,
      pmcid: a.pmcid, doi: a.doi, publication_types: a.publicationTypes,
      evidence_level: a.evidenceLevel, evidence_label: a.evidenceLabel,
      abstract: a.abstract, summary_pt: summaries[i], url: a.url, retracted: a.retracted,
    })));
    if (sourcesErr) throw new Error(`não gravou as fontes: ${sourcesErr.message}`);
    await saveTurn({
      status: "done", answer_md: answerMd, pubmed_query: pubmedQuery, guidelines_searched: guidelinesSearched,
      conclusion, evidence_strength: strength, evidence_reason: reason,
    });

    return json({ searchId: sid, turnId: id, status: "done", standaloneQuestion: shownStandalone });
  } catch (e) {
    if (e instanceof HttpError) {
      return json({ searchId, turnId, error: e.message, refunded: false }, e.status);
    }
    console.error(e);
    const refused = e instanceof RefusalError;
    // Sem isso o turno ficaria "pending" para sempre e o crédito seria perdido.
    await markFailed?.(refused ? "recusa do modelo" : String(e));
    return json({
      searchId,
      turnId,
      refunded: markFailed !== null,
      error: refused
        ? "Não foi possível responder a esta pergunta. Reformule com foco na evidência clínica."
        : "Não conseguimos concluir a pesquisa. Tente de novo em instantes.",
    }, refused ? 422 : 500);
  }
});

// ---------------------------------------------------------------------------
type Admin = ReturnType<typeof createClient>;

/**
 * Relatos de caso de uma resposta (1 crédito). A coluna case_reports_at trava pedido duplo;
 * se a busca falhar, ela volta a null e o crédito é devolvido.
 */
async function findCaseReports(
  admin: Admin, userId: string, searchId: string, turnId: string,
  debit: () => Promise<void>, refund: () => Promise<unknown>,
): Promise<Response> {
  const { data: search } = await admin.from("searches")
    .select("id, date_range").eq("id", searchId).eq("user_id", userId).maybeSingle();
  if (!search) throw new HttpError(404, "Pesquisa não encontrada.");
  const { data: rows } = await admin.from("search_turns")
    .select("id, position, status, pubmed_query, case_reports_at").eq("search_id", search.id);
  const turns = (rows ?? []) as { id: string; position: number; status: string; pubmed_query: string | null; case_reports_at: string | null }[];
  const target = turns.find((t) => t.id === turnId && t.status === "done");
  const topic = target ? topicQueryFor(target.position, turns) : null;
  if (!target || !topic) throw new HttpError(400, "Não foi possível buscar relatos de caso desta resposta.");
  const done = () => json({ searchId: search.id, turnId: target.id, status: "done" });
  if (target.case_reports_at) return done();

  const { data: claimed } = await admin.from("search_turns")
    .update({ case_reports_at: new Date().toISOString() }).eq("id", target.id).is("case_reports_at", null).select("id");
  if (!claimed?.length) return done();
  const release = () => admin.from("search_turns").update({ case_reports_at: null }).eq("id", target.id);
  try {
    await debit();
  } catch (e) {
    await release();
    throw e;
  }

  try {
    const pmids = await esearch(caseReportQuery(topic), rangeDays((search.date_range ?? "5y") as DateRange), MAX_CASE_REPORTS);
    const reports = pmids.length > 0 ? await efetch(pmids) : [];
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const summaries = await Promise.all(reports.map((a) => summarize(anthropic, a)));
    if (reports.length > 0) {
      const { error } = await admin.from("case_reports").insert(reports.map((a, i) => ({
        turn_id: target.id, search_id: search.id, position: i + 1, pmid: a.pmid, title: a.title, authors: a.authors,
        journal: a.journal, year: a.year, volume: a.volume, issue: a.issue, pages: a.pages, pmcid: a.pmcid, doi: a.doi,
        abstract: a.abstract, summary_pt: summaries[i], retracted: a.retracted,
      })));
      if (error) throw new Error(`não gravou os relatos de caso: ${error.message}`);
    }
    return done();
  } catch (e) {
    console.error("relatos de caso falharam", e);
    await release();
    await refund();
    throw new HttpError(500, "Não conseguimos buscar os relatos de caso. Tente de novo em instantes.");
  }
}

/** Resumo em português de um artigo; null sem resumo original ou se falhar (o card fica sem resumo). */
async function summarize(anthropic: Anthropic, a: Article): Promise<string | null> {
  if (!a.abstract) return null;
  try {
    return await ask(anthropic, CALLS.summary,
      `Título: ${a.title}\nTipo: ${a.publicationTypes.join(", ")}\nResumo original:\n${a.abstract}`);
  } catch (e) {
    console.error(`resumo do PMID ${a.pmid} falhou`, e);
    return null;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function rowToArticle(r: SourceRow): Article {
  return {
    pmid: r.pmid, title: r.title, authors: r.authors ?? "", journal: r.journal ?? "", year: r.year,
    volume: r.volume, issue: r.issue, pages: r.pages, pmcid: r.pmcid, doi: r.doi,
    publicationTypes: r.publication_types ?? [], abstract: r.abstract ?? "",
    url: r.url ?? `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`,
    evidenceLevel: (r.evidence_level ?? "low") as Article["evidenceLevel"],
    evidenceLabel: r.evidence_label ?? "Outro",
    retracted: r.retracted ?? false,
    summaryPt: r.summary_pt,
  };
}

/**
 * Uma chamada ao Claude que devolve só o texto final.
 * `fallbacks: "default"`: se o Sonnet 5.5 recusar por política (categorias cyber ou frontier_llm),
 * a própria API refaz a chamada em outro modelo. Recusa que sobra vira RefusalError.
 */
async function ask(
  anthropic: Anthropic,
  call: { system: string; effort: Effort; maxTokens: number },
  content: string,
): Promise<string> {
  const message = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: call.maxTokens,
    system: call.system,
    output_config: { effort: call.effort },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content }],
  });

  if (message.stop_reason === "refusal") {
    throw new RefusalError(`recusa: ${message.stop_details?.category ?? "sem categoria"}`);
  }
  // A resposta pode começar com blocos de thinking: lê só os blocos de texto.
  const text = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error(`resposta vazia (stop_reason: ${message.stop_reason})`);
  return text;
}
function ncbiParams(extra: Record<string, string>) {
  return new URLSearchParams({
    api_key: Deno.env.get("NCBI_API_KEY") ?? "", tool: "lumen", email: Deno.env.get("NCBI_EMAIL") ?? "", ...extra,
  });
}
async function fetchRetry(url: string, tries = 3): Promise<Response> {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url);
    if (r.ok) return r;
    if (r.status === 429 || r.status >= 500) { await new Promise((res) => setTimeout(res, 400 * (i + 1))); continue; }
    throw new Error(`NCBI ${r.status}`);
  }
  throw new Error("NCBI indisponível");
}

function rangeDays(dateRange: DateRange): number | null {
  return dateRange === "1y" ? 365 : dateRange === "5y" ? 1826 : null;
}

async function esearch(term: string, days: number | null, retmax: number): Promise<string[]> {
  const extra: Record<string, string> = { db: "pubmed", term, retmode: "json", retmax: String(retmax), sort: "relevance" };
  if (days) Object.assign(extra, { reldate: String(days), datetype: "pdat" });
  const r = await fetchRetry(`${EUTILS}/esearch.fcgi?${ncbiParams(extra)}`);
  const j = await r.json();
  return (j.esearchresult?.idlist ?? []) as string[];
}

/**
 * Preprints do medRxiv no Europe PMC (sem chave). Já publicados em revista ficam de fora.
 * O serviço cai com frequência: até 3 tentativas, cada uma com 5 s, antes de seguir sem preprints.
 */
async function searchPreprints(query: string): Promise<Preprint[]> {
  const params = new URLSearchParams({ query, format: "json", resultType: "core", pageSize: "6" });
  let lastError: unknown;
  for (let i = 0; i < 3; i++) {
    if (i > 0) await new Promise((res) => setTimeout(res, 500 * i));
    try {
      const r = await fetch(`${EUROPE_PMC}?${params}`, { signal: AbortSignal.timeout(5000) });
      const records = readEuropePmcResponse(await r.json().catch(() => null));
      const preprints = records.map(parsePreprint).filter((p): p is Preprint => p !== null);
      console.log(`preprints: ${records.length} encontrados, ${preprints.length} sem versão publicada`);
      return preprints;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function efetch(pmids: string[]): Promise<Article[]> {
  const r = await fetchRetry(`${EUTILS}/efetch.fcgi?${ncbiParams({ db: "pubmed", id: pmids.join(","), retmode: "xml" })}`);
  const xml = await r.text();
  return pmids.map((pmid) => parseArticle(xml, pmid)).filter((a): a is Article => a !== null);
}

// Parser mínimo por regex: suficiente para título, autores, periódico, ano, tipos e resumo.
function parseArticle(xml: string, pmid: string): Article | null {
  // O primeiro <PMID> do bloco é o do artigo; os seguintes podem ser de comentários e erratas.
  const block = xml.split("<PubmedArticle>").find((b) => b.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] === pmid);
  if (!block) return null;
  const g = (re: RegExp) => decodeEntities((block.match(re)?.[1] ?? "").replace(/<[^>]+>/g, "").trim());
  const title = titleOf(block);
  // Abreviação ISO ("N Engl J Med"), a usada no Vancouver; o nome completo fica de reserva.
  const journal = g(/<ISOAbbreviation>([\s\S]*?)<\/ISOAbbreviation>/) || g(/<Title>([\s\S]*?)<\/Title>/);
  const year = Number(g(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)) || null;
  const abstract = [...block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, "").trim())).join(" ");
  const authorsList = [...block.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<Initials>(.*?)<\/Initials>/g)]
    .map((m) => decodeEntities(`${m[1]} ${m[2]}`));
  // Até 7 autores: o front usa 6 no Vancouver e o 7º só indica que há outros ("et al.").
  const authors = authorsList.slice(0, 7).join("; ");
  const volume = g(/<JournalIssue[^>]*>[\s\S]*?<Volume>([\s\S]*?)<\/Volume>/) || null;
  const issue = g(/<JournalIssue[^>]*>[\s\S]*?<Issue>([\s\S]*?)<\/Issue>/) || null;
  const pages = g(/<MedlinePgn>([\s\S]*?)<\/MedlinePgn>/) || null;
  // Identificadores do próprio artigo: a primeira ArticleIdList de PubmedData (as seguintes são das referências).
  const ids = block.match(/<PubmedData>[\s\S]*?<ArticleIdList>([\s\S]*?)<\/ArticleIdList>/)?.[1] ?? "";
  const pmcid = ids.match(/<ArticleId IdType="pmc">(PMC\d+)<\/ArticleId>/)?.[1] ?? null;
  const doi = ids.match(/<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/)?.[1]?.trim() || null;
  const publicationTypes = publicationTypesOf(block);
  const { evidenceLevel, evidenceLabel } = isBrazilianGuideline({ publicationTypes, title, journal })
    ? { evidenceLevel: "mid" as const, evidenceLabel: BR_GUIDELINE }
    : classify(publicationTypes, title);
  return { pmid, title, authors, journal, year, volume, issue, pages, pmcid, doi, publicationTypes, abstract,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, evidenceLevel, evidenceLabel, retracted: isRetracted(block) };
}

function classify(types: string[], title: string): Pick<Article, "evidenceLevel" | "evidenceLabel"> {
  const t = types.map((x) => x.toLowerCase()); const ti = title.toLowerCase();
  if (t.includes("meta-analysis") || ti.includes("meta-analysis")) return { evidenceLevel: "high", evidenceLabel: "Metanálise" };
  if (t.includes("systematic review") || ti.includes("systematic review")) return { evidenceLevel: "high", evidenceLabel: "Revisão sistemática" };
  if (t.includes("randomized controlled trial")) return { evidenceLevel: "high", evidenceLabel: "Ensaio clínico randomizado" };
  if (t.includes("practice guideline") || t.includes("guideline")) return { evidenceLevel: "mid", evidenceLabel: "Diretriz" };
  if (t.includes("clinical trial")) return { evidenceLevel: "mid", evidenceLabel: "Ensaio clínico" };
  if (t.includes("observational study") || ti.includes("cohort")) return { evidenceLevel: "mid", evidenceLabel: "Coorte" };
  if (ti.includes("case-control")) return { evidenceLevel: "mid", evidenceLabel: "Caso-controle" };
  if (t.includes("review")) return { evidenceLevel: "low", evidenceLabel: "Revisão narrativa" };
  if (t.includes("case reports")) return { evidenceLevel: "low", evidenceLabel: "Relato de caso" };
  return { evidenceLevel: "low", evidenceLabel: "Outro" };
}
