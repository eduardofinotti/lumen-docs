import type { DateRange } from "@/types/search";

export const dateRanges: { id: DateRange; label: string }[] = [
  { id: "ultimo-ano", label: "Último ano" },
  { id: "ultimos-5-anos", label: "Últimos 5 anos" },
  { id: "qualquer-data", label: "Qualquer data" },
];

export const DEFAULT_DATE_RANGE: DateRange = "ultimos-5-anos";

export function isDateRange(value: string): value is DateRange {
  return dateRanges.some((r) => r.id === value);
}

export function dateRangeLabel(id: DateRange): string {
  return dateRanges.find((r) => r.id === id)?.label ?? "";
}
