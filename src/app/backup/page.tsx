"use client";

import { useState } from "react";
import { db } from "@/lib/db";

export default function BackupPage() {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  const handleExport = async () => {
    const [decks, cards, reviewStates, reviewLogs] = await Promise.all([
      db.decks.toArray(), db.cards.toArray(), db.reviewStates.toArray(), db.reviewLogs.toArray(),
    ]);
    const data = { version: 1, exportedAt: new Date().toISOString(), decks, cards, reviewStates, reviewLogs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `law-ox-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("백업 파일이 다운로드되었습니다.");
  };

  const handleImport = async (mode: "merge" | "replace") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      setMessage("");
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.version || !data.decks || !data.cards) throw new Error("올바르지 않은 백업 파일입니다.");
        if (mode === "replace") {
          await db.decks.clear(); await db.cards.clear(); await db.reviewStates.clear(); await db.reviewLogs.clear();
        }
        await db.decks.bulkPut(data.decks);
        await db.cards.bulkPut(data.cards);
        if (data.reviewStates) await db.reviewStates.bulkPut(data.reviewStates);
        if (data.reviewLogs) await db.reviewLogs.bulkPut(data.reviewLogs);
        setMessage(`가져오기 완료! 덱 ${data.decks.length}개, 카드 ${data.cards.length}개`);
      } catch (err) {
        setMessage(`오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="px-6 pt-8 pb-28 max-w-lg mx-auto">
      <h1 className="text-[22px] font-bold mb-8 anim-up" style={{ color: "#111" }}>백업 / 복원</h1>

      {/* Export */}
      <div className="card p-6 mb-5 anim-up" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#f5f5f5" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <div className="text-[14px] font-bold" style={{ color: "#111" }}>데이터 내보내기</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#aaa" }}>모든 덱, 카드, 학습 기록을 저장</div>
          </div>
        </div>
        <button onClick={handleExport} className="w-full py-3.5 btn-dark rounded-2xl text-[14px] font-bold">
          JSON 내보내기
        </button>
      </div>

      {/* Import */}
      <div className="card p-6 mb-5 anim-up" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#f5f5f5" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div>
            <div className="text-[14px] font-bold" style={{ color: "#111" }}>데이터 가져오기</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#aaa" }}>백업 파일에서 데이터 복원</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleImport("merge")} disabled={importing}
            className="flex-1 py-3.5 btn-dark rounded-2xl text-[13px] font-bold disabled:opacity-50">
            병합 가져오기
          </button>
          <button onClick={() => handleImport("replace")} disabled={importing}
            className="flex-1 py-3.5 btn-outline rounded-2xl text-[13px] font-bold disabled:opacity-50">
            덮어쓰기
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="card p-4 text-[13px] font-medium anim-scale" style={{
          background: message.startsWith("오류") ? "#fafafa" : "#fafafa",
          color: message.startsWith("오류") ? "#e00" : "#111",
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
