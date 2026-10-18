import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/search/result-view";
import { getConversation } from "@/lib/data/conversations";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const conversation = await getConversation((await params).id);
  return { title: conversation ? conversation.title : "Pesquisa não encontrada" };
}

export default async function ResultadoPage({ params }: { params: Params }) {
  const conversation = await getConversation((await params).id);
  if (!conversation) notFound();
  return <ResultView conversation={conversation} />;
}
