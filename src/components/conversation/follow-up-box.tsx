"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PatientBanner } from "@/components/search/patient-banner";
import { Button } from "@/components/ui/button";
import { MAX_QUESTION_LENGTH } from "@/lib/question";

/** Caixa de continuação, fixa no rodapé da coluna da conversa. */
export function FollowUpBox({
  disabled,
  limitReached,
  error,
  onSubmit,
  onEdit,
}: {
  disabled: boolean;
  limitReached: boolean;
  error: string | null;
  /** Devolve `true` quando a pergunta foi aceita (a caixa então se limpa). */
  onSubmit: (question: string) => Promise<boolean>;
  onEdit: () => void;
}) {
  const [value, setValue] = useState("");

  async function submit() {
    if (disabled) return;
    // No celular, fecha o teclado para o médico ver o andamento da resposta.
    if (window.matchMedia("(pointer: coarse)").matches && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (await onSubmit(value)) setValue("");
  }

  return (
    <div className="sticky bottom-0 z-10 -mx-4 bg-surface px-4 pt-3 pb-4 sm:-mx-6 sm:px-6">
      {limitReached ? (
        <p className="rounded-lg border border-line bg-surface-raised p-4 text-body-sm text-ink">
          Esta conversa chegou ao limite.{" "}
          <Link href="/pesquisa" className="font-medium underline underline-offset-4">
            Comece uma nova pesquisa.
          </Link>
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate
          className="space-y-2"
        >
          <PatientBanner />
          <div className="flex items-end gap-2 rounded-lg border border-line bg-surface-raised p-2 shadow-sm focus-within:border-line-strong focus-within:shadow-focus">
            <label htmlFor="continuacao" className="sr-only">
              Pergunta de continuação
            </label>
            <textarea
              id="continuacao"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                onEdit();
              }}
              onKeyDown={(e) => {
                // Enter envia; Shift+Enter quebra a linha.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Pergunte algo sobre esta pesquisa…"
              rows={1}
              enterKeyHint="send"
              maxLength={MAX_QUESTION_LENGTH}
              disabled={disabled}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "continuacao-erro" : undefined}
              className="block max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-body text-ink outline-none [field-sizing:content] placeholder:text-ink-muted focus-visible:shadow-none disabled:opacity-60"
            />
            <Button type="submit" size="icon-sm" disabled={disabled} aria-label="Enviar pergunta" className="pointer-coarse:size-10">
              <ArrowUp aria-hidden="true" />
            </Button>
          </div>
          {error && (
            <p id="continuacao-erro" role="alert" className="text-body-sm text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
