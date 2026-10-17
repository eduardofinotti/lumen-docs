import type { DateRange } from "@/types/search";

export const dateRanges: { id: DateRange; label: string }[] = [
  { id: "ultimo-ano", label: "Último ano" },
  { id: "ultimos-5-anos", label: "Últimos 5 anos" },
  { id: "qualquer-data", label: "Qualquer data" },
];

export const DEFAULT_DATE_RANGE: DateRange = "ultimos-5-anos";

/** Valor que a Edge Function `search` e a coluna `searches.date_range` usam. */
const apiValues: Record<DateRange, "1y" | "5y" | "all"> = {
  "ultimo-ano": "1y",
  "ultimos-5-anos": "5y",
  "qualquer-data": "all",
};

export function toApiDateRange(id: DateRange): "1y" | "5y" | "all" {
  return apiValues[id];
}

export function fromApiDateRange(value: string | null): DateRange {
  return dateRanges.find((r) => apiValues[r.id] === value)?.id ?? DEFAULT_DATE_RANGE;
}

export function isDateRange(value: string): value is DateRange {
  return dateRanges.some((r) => r.id === value);
}

export function dateRangeLabel(id: DateRange): string {
  return dateRanges.find((r) => r.id === id)?.label ?? "";
}
