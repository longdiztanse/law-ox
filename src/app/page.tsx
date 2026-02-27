"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getDueCards, getNewCards } from "@/lib/srs";
import { getTodayStats, type TodayStats } from "@/lib/stats";

export default function HomePage() {
  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);

  useEffect(() => {
    async function load() {
      const [due, newC, all, stats] = await Promise.all([
        getDueCards(),
        getNewCards(),
        db.cards.count(),
        getTodayStats(),
      ]);
      setDueCount(due.length);
      setNewCount(newC.length);
      setTotalCards(all);
      setTodayStats(stats);
    }
    load();
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Law OX</h1>
      <p className="text-sm text-slate-400 mb-6">변호사시험 기출 OX 학습</p>

      {/* Today Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">오늘 할 일</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{dueCount}</div>
            <div className="text-xs text-slate-400">복습 대기</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{newCount}</div>
            <div className="text-xs text-slate-400">새 카드</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-600">{totalCards}</div>
            <div className="text-xs text-slate-400">전체 카드</div>
          </div>
        </div>
      </div>

      {/* Today Stats */}
      {todayStats && todayStats.total > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">오늘 학습</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-slate-700">
                {todayStats.total}
              </div>
              <div className="text-xs text-slate-400">풀이</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">
                {todayStats.correct}
              </div>
              <div className="text-xs text-slate-400">정답</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-500">
                {todayStats.wrong}
              </div>
              <div className="text-xs text-slate-400">오답</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">
                {todayStats.accuracy}%
              </div>
              <div className="text-xs text-slate-400">정답률</div>
            </div>
          </div>
        </div>
      )}

      {/* Start Study */}
      <Link
        href="/study"
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-4 rounded-xl font-semibold text-lg transition-colors shadow-sm"
      >
        학습 시작
      </Link>

      {totalCards === 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400 mb-2">아직 카드가 없습니다</p>
          <Link
            href="/cards"
            className="text-sm text-blue-600 hover:underline"
          >
            카드 추가하기 →
          </Link>
        </div>
      )}

      {/* Backup link */}
      <Link
        href="/backup"
        className="block mt-6 text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        백업 / 복원 →
      </Link>
    </div>
  );
}
