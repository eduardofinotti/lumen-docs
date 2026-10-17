import type { DateRange } from "@/types/search";
import { mockQuestions, type MockResultKey } from "./results";

/** Pesquisa guardada no cookie do modo demonstração. */
export interface DemoSearchEntry {
  id: string;
  question: string;
  dateRange: DateRange;
  createdAt: string;
  resultKey: MockResultKey;
}

/** Histórico inicial do modo demonstração, para a sidebar não começar vazia. */
export const demoSeedSearches: DemoSearchEntry[] = [
  {
    id: "exemplo-sglt2",
    question: mockQuestions.sglt2,
    dateRange: "ultimos-5-anos",
    createdAt: "2026-10-15T14:20:00.000Z",
    resultKey: "sglt2",
  },
  {
    id: "exemplo-progesterona",
    question: mockQuestions.progesterona,
    dateRange: "qualquer-data",
    createdAt: "2026-10-12T10:05:00.000Z",
    resultKey: "progesterona",
  },
];
