"use client";

import { useEffect, useState } from "react";
import { getTodayStats, getWeakTags, type TodayStats, type WeakTag } from "@/lib/stats";

export default function StatsPage() {
  const [today, setToday] = useState<TodayStats | null>(null);
  const [weakTags, setWeakTags] = useState<WeakTag[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [t, w] = await Promise.all([getTodayStats(), getWeakTags()]);
      setToday(t);
      setWeakTags(w);
      setLoaded(true);
    }
    load();
  }, []);

  return (
    <div className="px-6 pt-8 pb-28 max-w-lg mx-auto">
      <h1 className="text-[22px] font-bold mb-8 anim-up" style={{ color: "#111" }}>통계</h1>

      {/* Today */}
      <div className="card p-6 mb-5 anim-up" style={{ animationDelay: "60ms" }}>
        <div className="text-[12px] font-semibold mb-5" style={{ color: "#aaa", letterSpacing: "0.5px" }}>오늘 학습 현황</div>
        {!loaded ? (
          <div className="py-8 text-center text-[13px]" style={{ color: "#ccc" }}>로딩 중...</div>
        ) : today && today.total > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-2 text-center mb-6">
              <div className="rounded-2xl py-3" style={{ background: "#f8f8f8" }}>
                <div className="text-[22px] font-bold" style={{ color: "#111" }}>{today.total}</div>
                <div className="text-[10px] mt-1" style={{ color: "#aaa" }}>총 풀이</div>
              </div>
              <div className="rounded-2xl py-3" style={{ background: "#f8f8f8" }}>
                <div className="text-[22px] font-bold" style={{ color: "#111" }}>{today.correct}</div>
                <div className="text-[10px] mt-1" style={{ color: "#aaa" }}>정답</div>
              </div>
              <div className="rounded-2xl py-3" style={{ background: "#f8f8f8" }}>
                <div className="text-[22px] font-bold" style={{ color: "#111" }}>{today.wrong}</div>
                <div className="text-[10px] mt-1" style={{ color: "#aaa" }}>오답</div>
              </div>
              <div className="rounded-2xl py-3" style={{ background: "#f8f8f8" }}>
                <div className="text-[22px] font-bold" style={{ color: "#111" }}>{today.confusing}</div>
                <div className="text-[10px] mt-1" style={{ color: "#aaa" }}>헷갈림</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[6px] rounded-full" style={{ background: "#f0f0f0" }}>
                <div className="h-full rounded-full progress-bar" style={{ width: `${today.accuracy}%`, background: "#111" }} />
              </div>
              <span className="text-[14px] font-bold min-w-[36px] text-right" style={{ color: "#111" }}>{today.accuracy}%</span>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "#f0f0f0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-[13px]" style={{ color: "#aaa" }}>오늘 아직 학습 기록이 없습니다</p>
          </div>
        )}
      </div>

      {/* Weak Tags */}
      <div className="card p-6 anim-up" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="text-[12px] font-semibold" style={{ color: "#aaa", letterSpacing: "0.5px" }}>취약 태그</div>
          <div className="text-[10px]" style={{ color: "#ccc" }}>오답률 높은 순</div>
        </div>
        {weakTags.length > 0 ? (
          <div className="space-y-1">
            {weakTags.map((wt, i) => (
              <div key={wt.tag} className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-[#fafafa] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-bold w-5 text-center" style={{ color: "#bbb" }}>{i + 1}</span>
                  <span className="pill pill-on text-[11px] py-1 px-3">{wt.tag}</span>
                  <span className="text-[11px]" style={{ color: "#ccc" }}>{wt.total}회</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-[5px] rounded-full" style={{ background: "#f0f0f0" }}>
                    <div className="h-full rounded-full" style={{ width: `${wt.wrongRate}%`, background: "#111" }} />
                  </div>
                  <span className="text-[12px] font-bold w-10 text-right" style={{ color: "#111" }}>{wt.wrongRate}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "#f0f0f0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p className="text-[13px]" style={{ color: "#aaa" }}>충분한 학습 데이터가 쌓이면 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
