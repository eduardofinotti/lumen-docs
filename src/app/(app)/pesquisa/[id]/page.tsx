import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/search/result-view";
import { getSearch } from "@/lib/data/searches";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const search = await getSearch((await params).id);
  return { title: search ? search.question : "Pesquisa não encontrada" };
}

export default async function ResultadoPage({ params }: { params: Params }) {
  const search = await getSearch((await params).id);
  if (!search) notFound();
  return <ResultView search={search} />;
}
