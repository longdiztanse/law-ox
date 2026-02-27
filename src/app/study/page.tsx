"use client";

import { useEffect, useState, useCallback } from "react";
import { db, type Card, type Deck } from "@/lib/db";
import { getDueCards, getNewCards, processReview } from "@/lib/srs";
import SwipeCard from "@/components/SwipeCard";

export default function StudyPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastResult, setLastResult] = useState<{
    correct: boolean;
    answer: string;
    explanation: string;
  } | null>(null);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    confusing: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState(0);

  const loadQueue = useCallback(async (deckId?: string) => {
    setIsLoading(true);
    const dueIds = await getDueCards(deckId || undefined);
    const newIds = await getNewCards(deckId || undefined);

    const allIds = [...dueIds, ...newIds.slice(0, 20)];

    if (allIds.length === 0) {
      setQueue([]);
      setIsLoading(false);
      return;
    }

    const cards = await db.cards.bulkGet(allIds);
    const validCards = cards.filter(Boolean) as Card[];

    // Shuffle
    for (let i = validCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validCards[i], validCards[j]] = [validCards[j], validCards[i]];
    }

    setQueue(validCards);
    setCurrentIdx(0);
    setLastResult(null);
    setShowExplanation(false);
    setSessionStats({ total: 0, correct: 0, wrong: 0, confusing: 0 });
    setIsLoading(false);
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    db.decks.toArray().then(setDecks);
    loadQueue();
  }, [loadQueue]);

  const currentCard = queue[currentIdx];

  const handleAnswer = useCallback(
    async (userAnswer: "O" | "X" | "confusing") => {
      if (!currentCard) return;

      let result: "correct" | "wrong" | "confusing";
      if (userAnswer === "confusing") {
        result = "confusing";
      } else {
        result = userAnswer === currentCard.answer ? "correct" : "wrong";
      }

      const timeMs = Date.now() - startTime;
      await processReview(currentCard.id, result, timeMs);

      setSessionStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (result === "correct" ? 1 : 0),
        wrong: prev.wrong + (result === "wrong" ? 1 : 0),
        confusing: prev.confusing + (result === "confusing" ? 1 : 0),
      }));

      setLastResult({
        correct: result === "correct",
        answer: currentCard.answer,
        explanation: currentCard.explanation,
      });
      setShowExplanation(true);
    },
    [currentCard, startTime]
  );

  const handleNext = useCallback(() => {
    setShowExplanation(false);
    setLastResult(null);
    setCurrentIdx((prev) => prev + 1);
    setStartTime(Date.now());
  }, []);

  // Space/Enter to advance after explanation
  useEffect(() => {
    if (!showExplanation) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showExplanation, handleNext]);

  const isFinished = currentIdx >= queue.length && queue.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800">학습</h1>
          {queue.length > 0 && !isFinished && (
            <p className="text-xs text-slate-400">
              {currentIdx + 1} / {queue.length}
            </p>
          )}
        </div>
        <select
          value={selectedDeck}
          onChange={(e) => {
            setSelectedDeck(e.target.value);
            loadQueue(e.target.value || undefined);
          }}
          className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
        >
          <option value="">전체 덱</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Session progress bar */}
      {queue.length > 0 && !isFinished && (
        <div className="px-4 flex-shrink-0">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${((currentIdx + 1) / queue.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 relative overflow-hidden">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-lg font-semibold text-slate-700 mb-1">
              학습할 카드가 없습니다
            </h2>
            <p className="text-sm text-slate-400 text-center">
              새 카드를 추가하거나 나중에 다시 와주세요
            </p>
          </div>
        ) : isFinished ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              학습 완료!
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sessionStats.correct}
                </div>
                <div className="text-xs text-slate-400">정답</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {sessionStats.wrong}
                </div>
                <div className="text-xs text-slate-400">오답</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">
                  {sessionStats.confusing}
                </div>
                <div className="text-xs text-slate-400">헷갈림</div>
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-4">
              정답률{" "}
              {sessionStats.total > 0
                ? Math.round(
                    (sessionStats.correct / sessionStats.total) * 100
                  )
                : 0}
              %
            </div>
            <button
              onClick={() => loadQueue(selectedDeck || undefined)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              다시 학습
            </button>
          </div>
        ) : showExplanation && lastResult ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div
              className={`text-5xl font-black mb-3 ${
                lastResult.correct ? "text-green-500" : "text-red-500"
              }`}
            >
              {lastResult.correct ? "정답!" : "오답!"}
            </div>
            <div className="text-sm text-slate-500 mb-4">
              정답: <span className="font-bold">{lastResult.answer}</span>
            </div>
            {lastResult.explanation && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 w-full max-w-sm mb-6">
                <p className="text-sm text-slate-700 leading-relaxed break-keep">
                  {lastResult.explanation}
                </p>
              </div>
            )}
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              다음 카드 (Space)
            </button>
          </div>
        ) : currentCard ? (
          <SwipeCard
            statement={currentCard.statement}
            cardType={currentCard.cardType}
            subject={currentCard.subject}
            index={currentIdx}
            total={queue.length}
            onSwipeRight={() => handleAnswer("O")}
            onSwipeLeft={() => handleAnswer("X")}
            onConfusing={() => handleAnswer("confusing")}
          />
        ) : null}
      </div>

      {/* Bottom action buttons (when card is shown) */}
      {currentCard && !showExplanation && !isFinished && (
        <div className="flex-shrink-0 p-4">
          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              onClick={() => handleAnswer("X")}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg transition-colors shadow-sm"
            >
              X
            </button>
            <button
              onClick={() => handleAnswer("confusing")}
              className="flex-none px-4 py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
            >
              ?
            </button>
            <button
              onClick={() => handleAnswer("O")}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors shadow-sm"
            >
              O
            </button>
          </div>
          <p className="text-center text-xs text-slate-300 mt-2">
            키보드: ← X | ↓ ? | O → | Space 다음
          </p>
        </div>
      )}
    </div>
  );
}
