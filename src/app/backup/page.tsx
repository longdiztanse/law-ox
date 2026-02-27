"use client";

import { useState } from "react";
import { db } from "@/lib/db";

export default function BackupPage() {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  const handleExport = async () => {
    const [decks, cards, reviewStates, reviewLogs] = await Promise.all([
      db.decks.toArray(),
      db.cards.toArray(),
      db.reviewStates.toArray(),
      db.reviewLogs.toArray(),
    ]);

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      decks,
      cards,
      reviewStates,
      reviewLogs,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
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

        if (!data.version || !data.decks || !data.cards) {
          throw new Error("올바르지 않은 백업 파일입니다.");
        }

        if (mode === "replace") {
          await db.decks.clear();
          await db.cards.clear();
          await db.reviewStates.clear();
          await db.reviewLogs.clear();
        }

        await db.decks.bulkPut(data.decks);
        await db.cards.bulkPut(data.cards);
        if (data.reviewStates) await db.reviewStates.bulkPut(data.reviewStates);
        if (data.reviewLogs) await db.reviewLogs.bulkPut(data.reviewLogs);

        setMessage(
          `가져오기 완료! 덱 ${data.decks.length}개, 카드 ${data.cards.length}개`
        );
      } catch (err) {
        setMessage(
          `오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
        );
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-4">백업 / 복원</h1>

      {/* Export */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-500 mb-2">
          데이터 내보내기
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          모든 덱, 카드, 학습 기록을 JSON 파일로 저장합니다.
        </p>
        <button
          onClick={handleExport}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          JSON 내보내기
        </button>
      </div>

      {/* Import */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-500 mb-2">
          데이터 가져오기
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          백업 JSON 파일을 선택하여 데이터를 복원합니다.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleImport("merge")}
            disabled={importing}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            병합 가져오기
          </button>
          <button
            onClick={() => handleImport("replace")}
            disabled={importing}
            className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            덮어쓰기
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.startsWith("오류")
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
