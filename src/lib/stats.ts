import { db } from "./db";

export interface TodayStats {
  total: number;
  correct: number;
  wrong: number;
  confusing: number;
  accuracy: number;
}

export interface WeakTag {
  tag: string;
  total: number;
  wrongRate: number;
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function getTodayStats(): Promise<TodayStats> {
  const todayStart = startOfToday();
  const logs = await db.reviewLogs
    .where("reviewedAt")
    .aboveOrEqual(todayStart)
    .toArray();

  const total = logs.length;
  const correct = logs.filter((l) => l.result === "correct").length;
  const wrong = logs.filter((l) => l.result === "wrong").length;
  const confusing = logs.filter((l) => l.result === "confusing").length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { total, correct, wrong, confusing, accuracy };
}

export async function getWeakTags(limit = 10): Promise<WeakTag[]> {
  const logs = await db.reviewLogs.toArray();
  const cards = await db.cards.toArray();

  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const tagStats = new Map<string, { total: number; wrong: number }>();

  for (const log of logs) {
    const card = cardMap.get(log.cardId);
    if (!card) continue;
    for (const tag of card.tags) {
      const stat = tagStats.get(tag) || { total: 0, wrong: 0 };
      stat.total += 1;
      if (log.result === "wrong" || log.result === "confusing") {
        stat.wrong += 1;
      }
      tagStats.set(tag, stat);
    }
  }

  const result: WeakTag[] = [];
  for (const [tag, stat] of tagStats) {
    if (stat.total >= 2) {
      result.push({
        tag,
        total: stat.total,
        wrongRate: Math.round((stat.wrong / stat.total) * 100),
      });
    }
  }

  return result
    .sort((a, b) => b.wrongRate - a.wrongRate)
    .slice(0, limit);
}
