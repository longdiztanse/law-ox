"use client";

import { useEffect, useState } from "react";
import {
  getTodayStats,
  getWeakTags,
  type TodayStats,
  type WeakTag,
} from "@/lib/stats";

export default function StatsPage() {
  const [today, setToday] = useState<TodayStats | null>(null);
  const [weakTags, setWeakTags] = useState<WeakTag[]>([]);

  useEffect(() => {
    async function load() {
      const [t, w] = await Promise.all([getTodayStats(), getWeakTags()]);
      setToday(t);
      setWeakTags(w);
    }
    load();
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-4">통계</h1>

      {/* Today */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">
          오늘 학습 현황
        </h2>
        {today ? (
          today.total > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-3 text-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-slate-700">
                    {today.total}
                  </div>
                  <div className="text-xs text-slate-400">총 풀이</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {today.correct}
                  </div>
                  <div className="text-xs text-slate-400">정답</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">
                    {today.wrong}
                  </div>
                  <div className="text-xs text-slate-400">오답</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-500">
                    {today.confusing}
                  </div>
                  <div className="text-xs text-slate-400">헷갈림</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${today.accuracy}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-600">
                  {today.accuracy}%
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">
              오늘 아직 학습 기록이 없습니다
            </p>
          )
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">로딩 중...</p>
        )}
      </div>

      {/* Weak Tags */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">
          취약 태그 (오답률 높은 순)
        </h2>
        {weakTags.length > 0 ? (
          <div className="space-y-2">
            {weakTags.map((wt) => (
              <div
                key={wt.tag}
                className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                    {wt.tag}
                  </span>
                  <span className="text-xs text-slate-400">
                    {wt.total}회 학습
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${wt.wrongRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-red-500 w-8 text-right">
                    {wt.wrongRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">
            충분한 학습 데이터가 쌓이면 표시됩니다
          </p>
        )}
      </div>
    </div>
  );
}
