"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleSaved } from "@/app/(app)/salvos/actions";
import { cn } from "@/lib/utils";

/** Marcador de salvar artigo. Muda na hora e volta atrás se o servidor recusar. */
export function SaveButton({
  pmid,
  searchId,
  initialSaved,
}: {
  pmid: string;
  searchId: string | null;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !saved;
    setSaved(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleSaved(pmid, searchId, next);
      if (!result.ok) {
        setSaved(!next);
        setError(result.error);
        return;
      }
      // O mesmo artigo pode aparecer em outras respostas da página: atualiza o estado de todos.
      router.refresh();
    });
  }

  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          "focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-body-sm transition-colors",
          saved
            ? "border-line-strong bg-surface-sunken font-medium text-ink"
            : "border-line text-ink-secondary hover:border-line-strong hover:text-ink",
        )}
      >
        <Icon className={cn("size-4 stroke-[1.5]", saved && "text-lumen")} aria-hidden="true" />
        {saved ? "Salvo" : "Salvar"}
      </button>
      {error && (
        <p role="alert" className="max-w-40 text-right text-body-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
