import Dexie, { type EntityTable } from "dexie";

export interface Deck {
  id: string;
  name: string;
  subject: "civil" | "criminal" | "public" | "mixed";
  createdAt: number;
  updatedAt: number;
}

export type CardType = "REQ" | "EFF" | "EXC" | "BUR" | "CMP" | "GEN";

export interface Card {
  id: string;
  deckId: string;
  subject: string;
  doctrineId: string;
  cardType: CardType;
  statement: string;
  answer: "O" | "X";
  explanation: string;
  tags: string[];
  sourceNote?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReviewState {
  cardId: string;
  dueAt: number;
  intervalDays: number;
  ease: number;
  streak: number;
  lapses: number;
  lastReviewedAt: number | null;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  reviewedAt: number;
  result: "correct" | "wrong" | "confusing";
  timeMs?: number;
}

class LawOxDB extends Dexie {
  decks!: EntityTable<Deck, "id">;
  cards!: EntityTable<Card, "id">;
  reviewStates!: EntityTable<ReviewState, "cardId">;
  reviewLogs!: EntityTable<ReviewLog, "id">;

  constructor() {
    super("law-ox-db");
    this.version(1).stores({
      decks: "id, subject, createdAt",
      cards: "id, deckId, subject, cardType, *tags, createdAt",
      reviewStates: "cardId, dueAt",
      reviewLogs: "id, cardId, reviewedAt",
    });
  }
}

export const db = new LawOxDB();
