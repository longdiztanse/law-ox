import { v4 as uuidv4 } from "uuid";
import { db, type ReviewState, type ReviewLog } from "./db";

type ReviewResult = "correct" | "wrong" | "confusing";

export function computeNextState(
  state: ReviewState,
  result: ReviewResult
): ReviewState {
  const now = Date.now();
  let { intervalDays, ease, streak, lapses } = state;

  switch (result) {
    case "correct":
      streak += 1;
      intervalDays = intervalDays === 0 ? 1 : Math.min(intervalDays * 2, 60);
      ease = Math.min(ease + 0.05, 2.5);
      break;
    case "wrong":
      lapses += 1;
      streak = 0;
      intervalDays = 1;
      ease = Math.max(ease - 0.15, 1.3);
      break;
    case "confusing":
      streak = Math.max(streak - 1, 0);
      intervalDays = Math.max(1, Math.round(intervalDays * 0.6));
      ease = Math.max(ease - 0.05, 1.3);
      break;
  }

  const dueAt = now + intervalDays * 24 * 60 * 60 * 1000;

  return {
    ...state,
    intervalDays,
    ease,
    streak,
    lapses,
    dueAt,
    lastReviewedAt: now,
  };
}

export async function processReview(
  cardId: string,
  result: ReviewResult,
  timeMs?: number
): Promise<void> {
  const now = Date.now();

  let state = await db.reviewStates.get(cardId);
  if (!state) {
    state = {
      cardId,
      dueAt: now,
      intervalDays: 0,
      ease: 2.0,
      streak: 0,
      lapses: 0,
      lastReviewedAt: null,
    };
  }

  const nextState = computeNextState(state, result);
  await db.reviewStates.put(nextState);

  const log: ReviewLog = {
    id: uuidv4(),
    cardId,
    reviewedAt: now,
    result,
    timeMs,
  };
  await db.reviewLogs.add(log);
}

export async function getDueCards(deckId?: string): Promise<string[]> {
  const now = Date.now();

  const allStates = await db.reviewStates
    .where("dueAt")
    .belowOrEqual(now)
    .toArray();

  const dueCardIds = new Set(allStates.map((s) => s.cardId));

  if (deckId) {
    const deckCards = await db.cards.where("deckId").equals(deckId).toArray();
    return deckCards
      .filter((c) => dueCardIds.has(c.id))
      .map((c) => c.id);
  }

  return Array.from(dueCardIds);
}

export async function getNewCards(deckId?: string): Promise<string[]> {
  const allReviewedIds = new Set(
    (await db.reviewStates.toArray()).map((s) => s.cardId)
  );

  let cards;
  if (deckId) {
    cards = await db.cards.where("deckId").equals(deckId).toArray();
  } else {
    cards = await db.cards.toArray();
  }

  return cards.filter((c) => !allReviewedIds.has(c.id)).map((c) => c.id);
}
