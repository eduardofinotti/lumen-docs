import type { DateRange } from "@/types/search";
import { mockQuestions, type MockResultKey } from "./results";

/** Pergunta de uma conversa do modo demonstração: guarda só a referência ao mock. */
export interface DemoTurnEntry {
  id: string;
  question: string;
  /** Null na primeira pergunta. */
  standaloneQuestion: string | null;
  resultKey: MockResultKey;
  createdAt: string;
}

/** Conversa guardada no cookie do modo demonstração. */
export interface DemoConversationEntry {
  id: string;
  dateRange: DateRange;
  createdAt: string;
  updatedAt: string;
  turns: DemoTurnEntry[];
}

/** Histórico inicial do modo demonstração, para a sidebar não começar vazia. */
export const demoSeedConversations: DemoConversationEntry[] = [
  {
    id: "exemplo-sglt2",
    dateRange: "ultimos-5-anos",
    createdAt: "2026-10-15T14:20:00.000Z",
    updatedAt: "2026-10-15T14:20:00.000Z",
    turns: [
      {
        id: "exemplo-sglt2-1",
        question: mockQuestions.sglt2,
        standaloneQuestion: null,
        resultKey: "sglt2",
        createdAt: "2026-10-15T14:20:00.000Z",
      },
    ],
  },
  {
    id: "exemplo-progesterona",
    dateRange: "qualquer-data",
    createdAt: "2026-10-12T10:05:00.000Z",
    updatedAt: "2026-10-12T10:05:00.000Z",
    turns: [
      {
        id: "exemplo-progesterona-1",
        question: mockQuestions.progesterona,
        standaloneQuestion: null,
        resultKey: "progesterona",
        createdAt: "2026-10-12T10:05:00.000Z",
      },
    ],
  },
];
