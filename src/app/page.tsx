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
  const [loaded, setLoaded] = useState(false);

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
      setLoaded(true);
    }
    load();
  }, []);

  return (
    <div className="px-6 pt-10 pb-8 max-w-lg mx-auto">
      {/* Greeting (1번 사진 스타일) */}
      <div className="mb-10 anim-up">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight" style={{ color: "#111" }}>
          안녕하세요,
        </h1>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight" style={{ color: "#888" }}>
          오늘도 학습할까요?
        </h1>
      </div>

      {/* Menu Grid (1번 사진 - 2x2 카드 그리드) */}
      <div className="grid grid-cols-2 gap-4 mb-8 stagger">
        <Link href="/study" className="card p-5 flex flex-col gap-3 anim-up active:scale-[0.97] transition-transform">
          <div className="w-11 h-11 rounded-2xl bg-[#f5f5f5] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color: "#111" }}>학습</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#aaa" }}>OX 카드 풀기</div>
          </div>
        </Link>

        <Link href="/cards" className="card p-5 flex flex-col gap-3 anim-up active:scale-[0.97] transition-transform">
          <div className="w-11 h-11 rounded-2xl bg-[#f5f5f5] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color: "#111" }}>카드</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#aaa" }}>카드 추가, 수정...</div>
          </div>
        </Link>

        <Link href="/decks" className="card p-5 flex flex-col gap-3 anim-up active:scale-[0.97] transition-transform">
          <div className="w-11 h-11 rounded-2xl bg-[#f5f5f5] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color: "#111" }}>덱 관리</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#aaa" }}>과목별 덱 정리</div>
          </div>
        </Link>

        <Link href="/stats" className="card p-5 flex flex-col gap-3 anim-up active:scale-[0.97] transition-transform">
          <div className="w-11 h-11 rounded-2xl bg-[#f5f5f5] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color: "#111" }}>통계</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#aaa" }}>성적, 취약 태그</div>
          </div>
        </Link>
      </div>

      {/* Summary card */}
      <div className="card p-6 mb-6 anim-up" style={{ animationDelay: "200ms" }}>
        <div className="text-[12px] font-semibold mb-5" style={{ color: "#aaa", letterSpacing: "0.5px" }}>
          오늘 현황
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-[26px] font-bold" style={{ color: "#111" }}>{loaded ? dueCount : "–"}</div>
            <div className="text-[11px] mt-1" style={{ color: "#aaa" }}>복습 대기</div>
          </div>
          <div>
            <div className="text-[26px] font-bold" style={{ color: "#111" }}>{loaded ? newCount : "–"}</div>
            <div className="text-[11px] mt-1" style={{ color: "#aaa" }}>새 카드</div>
          </div>
          <div>
            <div className="text-[26px] font-bold" style={{ color: "#111" }}>{loaded ? totalCards : "–"}</div>
            <div className="text-[11px] mt-1" style={{ color: "#aaa" }}>전체</div>
          </div>
        </div>
      </div>

      {/* Today stats */}
      {todayStats && todayStats.total > 0 && (
        <div className="card p-6 mb-6 anim-up" style={{ animationDelay: "250ms" }}>
          <div className="text-[12px] font-semibold mb-5" style={{ color: "#aaa", letterSpacing: "0.5px" }}>
            오늘 학습
          </div>
          <div className="grid grid-cols-4 gap-2 text-center mb-5">
            <div>
              <div className="text-[22px] font-bold">{todayStats.total}</div>
              <div className="text-[10px] mt-1" style={{ color: "#aaa" }}>풀이</div>
            </div>
            <div>
              <div className="text-[22px] font-bold">{todayStats.correct}</div>
              <div className="text-[10px] mt-1" style={{ color: "#aaa" }}>정답</div>
            </div>
            <div>
              <div className="text-[22px] font-bold">{todayStats.wrong}</div>
              <div className="text-[10px] mt-1" style={{ color: "#aaa" }}>오답</div>
            </div>
            <div>
              <div className="text-[22px] font-bold">{todayStats.accuracy}%</div>
              <div className="text-[10px] mt-1" style={{ color: "#aaa" }}>정답률</div>
            </div>
          </div>
          <div className="h-2 rounded-full" style={{ background: "#f0f0f0" }}>
            <div className="h-full rounded-full progress-bar" style={{ width: `${todayStats.accuracy}%`, background: "#111" }} />
          </div>
        </div>
      )}

      {/* Start study CTA */}
      <Link
        href="/study"
        className="block w-full text-center py-4 btn-dark text-[16px] font-bold rounded-2xl anim-up"
        style={{ animationDelay: "300ms" }}
      >
        학습 시작
      </Link>

      {/* Backup link */}
      <Link
        href="/backup"
        className="flex items-center justify-center gap-1.5 mt-8 text-[12px] anim-in"
        style={{ color: "#bbb", animationDelay: "400ms" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        백업 / 복원
      </Link>
    </div>
  );
}
