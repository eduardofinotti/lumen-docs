"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { dateRanges, isDateRange } from "@/lib/date-range";
import { MAX_QUESTION_LENGTH } from "@/lib/question";
import type { DateRange } from "@/types/search";

/** Caixa de pergunta: o elemento central da tela de pesquisa. */
export function QuestionBox({
  value,
  onChange,
  dateRange,
  onDateRangeChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div className="rounded-lg border border-line bg-surface-raised shadow-sm transition-colors focus-within:border-line-strong focus-within:shadow-focus">
        <label htmlFor="pergunta" className="sr-only">
          Sua pergunta clínica
        </label>
        <textarea
          id="pergunta"
          name="pergunta"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia; Shift+Enter quebra a linha.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Ex.: Em gestantes com colo curto, a progesterona vaginal reduz o parto prematuro?"
          rows={3}
          enterKeyHint="search"
          maxLength={MAX_QUESTION_LENGTH}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "pergunta-erro" : undefined}
          className="block max-h-60 min-h-24 w-full resize-none bg-transparent px-4 pt-4 text-body text-ink outline-none [field-sizing:content] placeholder:text-ink-muted focus-visible:shadow-none sm:px-6 sm:pt-6"
        />
        <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-4 sm:px-6 sm:pb-6">
          <div className="w-44 min-w-0">
            <label htmlFor="periodo" className="sr-only">
              Período de publicação
            </label>
            <NativeSelect
              id="periodo"
              value={dateRange}
              onChange={(e) => isDateRange(e.target.value) && onDateRangeChange(e.target.value)}
              className="h-9 text-body-sm pointer-coarse:h-11 pointer-coarse:text-body"
            >
              {dateRanges.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit">
            <Search aria-hidden="true" />
            Pesquisar
          </Button>
        </div>
      </div>
      {error && (
        <p id="pergunta-erro" role="alert" className="mt-3 text-body-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
