"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0, wrong: 0, confusing: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState(0);
  const [dragProgress, setDragProgress] = useState(0);

  const handleDragProgress = useCallback((progress: number) => {
    setDragProgress(progress);
  }, []);

  const wrongIdsRef = useRef<Set<string>>(new Set());

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startSession = useCallback((cards: Card[]) => {
    const shuffled = shuffle(cards);
    setQueue(shuffled);
    setCurrentIdx(0);
    setLastResult(null);
    setShowExplanation(false);
    setSessionStats({ total: 0, correct: 0, wrong: 0, confusing: 0 });
    wrongIdsRef.current = new Set();
    setIsLoading(false);
    setStartTime(Date.now());
  }, []);

  const loadQueue = useCallback(async (deckId?: string) => {
    setIsLoading(true);
    const dueIds = await getDueCards(deckId || undefined);
    const newIds = await getNewCards(deckId || undefined);
    const allIds = [...dueIds, ...newIds.slice(0, 20)];
    if (allIds.length === 0) { setQueue([]); setIsLoading(false); return; }
    const cards = await db.cards.bulkGet(allIds);
    const validCards = cards.filter(Boolean) as Card[];
    startSession(validCards);
  }, [startSession]);

  const loadAllFromDeck = useCallback(async (deckId?: string) => {
    setIsLoading(true);
    let cards: Card[];
    if (deckId) {
      cards = await db.cards.where("deckId").equals(deckId).toArray();
    } else {
      cards = await db.cards.toArray();
    }
    if (cards.length === 0) { setQueue([]); setIsLoading(false); return; }
    startSession(cards);
  }, [startSession]);

  const retryWrongOnly = useCallback(() => {
    const wrongCards = queue.filter(c => wrongIdsRef.current.has(c.id));
    if (wrongCards.length === 0) return;
    startSession(wrongCards);
  }, [queue, startSession]);

  useEffect(() => { db.decks.toArray().then(setDecks); loadQueue(); }, [loadQueue]);

  const currentCard = queue[currentIdx];

  const handleAnswer = useCallback(async (userAnswer: "O" | "X" | "confusing") => {
    if (!currentCard) return;
    let result: "correct" | "wrong" | "confusing";
    if (userAnswer === "confusing") result = "confusing";
    else result = userAnswer === currentCard.answer ? "correct" : "wrong";
    const timeMs = Date.now() - startTime;
    await processReview(currentCard.id, result, timeMs);
    if (result !== "correct") wrongIdsRef.current.add(currentCard.id);
    setSessionStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (result === "correct" ? 1 : 0),
      wrong: prev.wrong + (result === "wrong" ? 1 : 0),
      confusing: prev.confusing + (result === "confusing" ? 1 : 0),
    }));
    setDragProgress(0);
    setLastResult({ correct: result === "correct", answer: currentCard.answer, explanation: currentCard.explanation });
    setShowExplanation(true);
  }, [currentCard, startTime]);

  const handleNext = useCallback(() => {
    setShowExplanation(false);
    setLastResult(null);
    setCurrentIdx((prev) => prev + 1);
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (!showExplanation) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleNext(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showExplanation, handleNext]);

  const isFinished = currentIdx >= queue.length && queue.length > 0;
  const progress = queue.length > 0 ? ((currentIdx + (showExplanation ? 1 : 0)) / queue.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-8 h-8 rounded-full" style={{ border: "2.5px solid #e0e0e0", borderTopColor: "#111", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span className="text-[13px] font-medium" style={{ color: "#aaa" }}>불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-6 flex-shrink-0">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: "#111" }}>학습</h1>
          {queue.length > 0 && !isFinished && (
            <p className="text-[12px] font-medium mt-1" style={{ color: "#bbb" }}>{currentIdx + 1} / {queue.length}</p>
          )}
        </div>
        <select
          value={selectedDeck}
          onChange={(e) => { setSelectedDeck(e.target.value); loadQueue(e.target.value || undefined); }}
          className="px-3 py-2 text-[12px] font-medium rounded-xl bg-white border"
          style={{ borderColor: "#e0e0e0", color: "#666" }}
        >
          <option value="">전체 덱</option>
          {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Progress */}
      {queue.length > 0 && !isFinished && (
        <div className="px-6 pb-2 flex-shrink-0">
          <div className="h-[5px] rounded-full" style={{ background: "#e8e8e8" }}>
            <div className="h-full rounded-full progress-bar" style={{ width: `${progress}%`, background: "#111" }} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 relative overflow-hidden">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 anim-up">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "#eee" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-[18px] font-bold mb-2" style={{ color: "#111" }}>학습할 카드가 없습니다</h2>
            <p className="text-[13px] mb-6" style={{ color: "#aaa" }}>새 카드를 추가하거나 나중에 다시 와주세요</p>
            <button onClick={() => loadAllFromDeck(selectedDeck || undefined)} className="btn-dark px-10 py-3.5 rounded-2xl text-[14px] font-bold">
              전체 반복 학습
            </button>
          </div>
        ) : isFinished ? (
          <div className="flex flex-col items-center justify-center h-full px-6 anim-up">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 anim-bounce" style={{ background: "#f0f0f0" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-[22px] font-bold mb-10" style={{ color: "#111" }}>학습 완료!</h2>
            <div className="grid grid-cols-3 gap-5 text-center mb-10 w-full max-w-[280px]">
              <div className="card p-4">
                <div className="text-[24px] font-bold" style={{ color: "#111" }}>{sessionStats.correct}</div>
                <div className="text-[11px] mt-1" style={{ color: "#aaa" }}>정답</div>
              </div>
              <div className="card p-4">
                <div className="text-[24px] font-bold" style={{ color: "#111" }}>{sessionStats.wrong}</div>
                <div className="text-[11px] mt-1" style={{ color: "#aaa" }}>오답</div>
              </div>
              <div className="card p-4">
                <div className="text-[24px] font-bold" style={{ color: "#111" }}>{sessionStats.confusing}</div>
                <div className="text-[11px] mt-1" style={{ color: "#aaa" }}>헷갈림</div>
              </div>
            </div>
            <div className="text-[14px] font-medium mb-8" style={{ color: "#888" }}>
              정답률 <span className="text-[18px] font-bold" style={{ color: "#111" }}>{sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%</span>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[240px]">
              <button onClick={() => loadAllFromDeck(selectedDeck || undefined)} className="btn-dark w-full py-3.5 rounded-2xl text-[14px] font-bold">
                반복 학습
              </button>
              {wrongIdsRef.current.size > 0 && (
                <button onClick={retryWrongOnly} className="btn-outline w-full py-3.5 rounded-2xl text-[14px] font-bold">
                  오답만 복습 ({wrongIdsRef.current.size})
                </button>
              )}
              <button onClick={() => loadQueue(selectedDeck || undefined)} className="w-full py-3 rounded-2xl text-[13px] font-medium" style={{ color: "#999" }}>
                새 카드 학습
              </button>
            </div>
          </div>
        ) : showExplanation && lastResult ? (
          <div className="flex flex-col items-center justify-center h-full px-6 anim-scale">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 anim-bounce" style={{ background: "#f0f0f0" }}>
              {lastResult.correct ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              )}
            </div>
            <div className="text-[28px] font-bold mb-3" style={{ color: "#111" }}>
              {lastResult.correct ? "정답!" : "오답!"}
            </div>
            <div className="flex items-center gap-2 text-[14px] mb-6" style={{ color: "#888" }}>
              정답:
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-[16px] font-bold" style={{ background: "#f0f0f0", color: "#111" }}>
                {lastResult.answer}
              </span>
            </div>
            {lastResult.explanation && (
              <div className="card p-5 w-full max-w-sm mb-8">
                <p className="text-[13px] leading-relaxed break-keep" style={{ color: "#555" }}>{lastResult.explanation}</p>
              </div>
            )}
            <button onClick={handleNext} className="btn-dark px-12 py-3.5 rounded-2xl text-[14px] font-bold">
              다음 카드 <span className="ml-2 text-[12px] font-normal" style={{ color: "#888" }}>Space</span>
            </button>
          </div>
        ) : currentCard ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Render stack: deepest first for z-index */}
            {[2, 1, 0].map((pos) => {
              const cardIdx = currentIdx + pos;
              if (cardIdx >= queue.length) return null;
              const card = queue[cardIdx];
              return (
                <SwipeCard
                  key={card.id}
                  statement={card.statement}
                  cardType={card.cardType}
                  subject={card.subject}
                  index={currentIdx}
                  total={queue.length}
                  stackPosition={pos}
                  dragProgress={dragProgress}
                  onDragProgress={pos === 0 ? handleDragProgress : undefined}
                  onSwipeRight={() => handleAnswer("O")}
                  onSwipeLeft={() => handleAnswer("X")}
                  onConfusing={() => handleAnswer("confusing")}
                />
              );
            })}
          </div>
        ) : null}
      </div>

    </div>
  );
}
