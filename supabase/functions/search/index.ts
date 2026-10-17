// Lúmen · Edge Function `search`
// Fluxo: pergunta em pt-BR → query PubMed (Claude) → esearch → efetch → síntese (Claude) → grava no banco.
// Deploy: supabase functions deploy search --no-verify-jwt=false
// Secrets: ANTHROPIC_API_KEY, NCBI_API_KEY, NCBI_EMAIL (SUPABASE_URL e SERVICE_ROLE já existem no runtime)

import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.52.0";
import { SYSTEM_QUERY, SYSTEM_SYNTHESIS, SYSTEM_SUMMARY } from "./prompts.ts";

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const MODEL = "claude-sonnet-4-5";          // trocar pelo modelo atual disponível na conta
const MAX_ARTICLES = 12;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Article = {
  pmid: string; title: string; authors: string; journal: string; year: number | null;
  publicationTypes: string[]; abstract: string; url: string;
  evidenceLevel: "high" | "mid" | "low"; evidenceLabel: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // 1. Autenticação ------------------------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return json({ error: "Não autenticado." }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { question, dateRange = "5y" } = await req.json() as { question: string; dateRange?: "1y" | "5y" | "all" };
    if (!question || question.trim().length < 8) return json({ error: "Escreva uma pergunta mais completa." }, 400);

    // 2. Crédito -----------------------------------------------------------
    const { data: ok } = await admin.rpc("debit_credit", { p_user: user.id });
    if (!ok) return json({ error: "Seus créditos acabaram." }, 402);

    const { data: search } = await admin.from("searches")
      .insert({ user_id: user.id, question, date_range: dateRange }).select("id").single();
    const searchId = search!.id;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    // 3. Pergunta → query PubMed ------------------------------------------
    const q = await anthropic.messages.create({
      model: MODEL, max_tokens: 300, system: SYSTEM_QUERY,
      messages: [{ role: "user", content: question }],
    });
    const pubmedQuery = text(q).trim();

    // 4. esearch + efetch --------------------------------------------------
    const pmids = await esearch(pubmedQuery, dateRange);
    if (pmids.length === 0) {
      await admin.from("searches").update({ status: "no_evidence", pubmed_query: pubmedQuery }).eq("id", searchId);
      return json({ searchId, status: "no_evidence", pubmedQuery }, 200);
    }
    const articles = await efetch(pmids);

    // 5. Síntese em português ---------------------------------------------
    const context = articles.map((a, i) =>
      `[${i + 1}] PMID ${a.pmid}\nTítulo: ${a.title}\nTipo: ${a.publicationTypes.join(", ")}\nPeriódico/ano: ${a.journal} ${a.year ?? ""}\nResumo: ${a.abstract || "(sem resumo)"}`
    ).join("\n\n");

    const s = await anthropic.messages.create({
      model: MODEL, max_tokens: 1200, system: SYSTEM_SYNTHESIS,
      messages: [{ role: "user", content: `PERGUNTA DO MÉDICO:\n${question}\n\nARTIGOS ENCONTRADOS:\n${context}` }],
    });
    const answerMd = text(s).trim();

    // 6. Resumo em português de cada artigo (em paralelo, curto) -----------
    const summaries = await Promise.all(articles.map(async (a) => {
      if (!a.abstract) return null;
      const r = await anthropic.messages.create({
        model: MODEL, max_tokens: 350, system: SYSTEM_SUMMARY,
        messages: [{ role: "user", content: `Título: ${a.title}\nTipo: ${a.publicationTypes.join(", ")}\nResumo original:\n${a.abstract}` }],
      });
      return text(r).trim();
    }));

    // 7. Persistência --------------------------------------------------------
    await admin.from("sources").insert(articles.map((a, i) => ({
      search_id: searchId, position: i + 1, pmid: a.pmid, title: a.title, authors: a.authors,
      journal: a.journal, year: a.year, publication_types: a.publicationTypes,
      evidence_level: a.evidenceLevel, evidence_label: a.evidenceLabel,
      abstract: a.abstract, summary_pt: summaries[i], url: a.url,
    })));
    await admin.from("searches").update({ status: "done", answer_md: answerMd, pubmed_query: pubmedQuery }).eq("id", searchId);

    return json({ searchId, status: "done", answerMd, pubmedQuery,
      sources: articles.map((a, i) => ({ position: i + 1, ...a, summaryPt: summaries[i] })) });
  } catch (e) {
    console.error(e);
    return json({ error: "Não conseguimos concluir a pesquisa. Tente de novo em instantes." }, 500);
  }
});

// ---------------------------------------------------------------------------
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
function text(m: Anthropic.Message) {
  return m.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
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

async function esearch(term: string, dateRange: string): Promise<string[]> {
  const extra: Record<string, string> = { db: "pubmed", term, retmode: "json", retmax: String(MAX_ARTICLES), sort: "relevance" };
  if (dateRange === "1y") extra.reldate = "365";
  if (dateRange === "5y") extra.reldate = "1826";
  if (extra.reldate) extra.datetype = "pdat";
  const r = await fetchRetry(`${EUTILS}/esearch.fcgi?${ncbiParams(extra)}`);
  const j = await r.json();
  return (j.esearchresult?.idlist ?? []) as string[];
}

async function efetch(pmids: string[]): Promise<Article[]> {
  const r = await fetchRetry(`${EUTILS}/efetch.fcgi?${ncbiParams({ db: "pubmed", id: pmids.join(","), retmode: "xml" })}`);
  const xml = await r.text();
  return pmids.map((pmid) => parseArticle(xml, pmid)).filter((a): a is Article => a !== null);
}

// Parser mínimo por regex: suficiente para título, autores, periódico, ano, tipos e resumo.
function parseArticle(xml: string, pmid: string): Article | null {
  const block = xml.split("<PubmedArticle>").find((b) => b.includes(`<PMID Version="1">${pmid}</PMID>`));
  if (!block) return null;
  const g = (re: RegExp) => (block.match(re)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
  const title = g(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
  const journal = g(/<Title>([\s\S]*?)<\/Title>/);
  const year = Number(g(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)) || null;
  const abstract = [...block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim()).join(" ");
  const authorsList = [...block.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<Initials>(.*?)<\/Initials>/g)]
    .map((m) => `${m[1]} ${m[2]}`);
  const authors = authorsList.length > 3 ? `${authorsList[0]} et al.` : authorsList.join(", ");
  const publicationTypes = [...block.matchAll(/<PublicationType[^>]*>(.*?)<\/PublicationType>/g)].map((m) => m[1]);
  const { evidenceLevel, evidenceLabel } = classify(publicationTypes, title);
  return { pmid, title, authors, journal, year, publicationTypes, abstract,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, evidenceLevel, evidenceLabel };
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
