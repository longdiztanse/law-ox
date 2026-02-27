"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db, type Card, type Deck, type CardType } from "@/lib/db";

const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: "REQ", label: "요건" },
  { value: "EFF", label: "효과" },
  { value: "EXC", label: "예외" },
  { value: "BUR", label: "증명책임" },
  { value: "CMP", label: "비교" },
  { value: "GEN", label: "일반" },
];

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [filterDeck, setFilterDeck] = useState("");
  const [filterType, setFilterType] = useState("");

  // Form state
  const [deckId, setDeckId] = useState("");
  const [subject, setSubject] = useState("civil");
  const [doctrineId, setDoctrineId] = useState("");
  const [cardType, setCardType] = useState<CardType>("GEN");
  const [statement, setStatement] = useState("");
  const [answer, setAnswer] = useState<"O" | "X">("O");
  const [explanation, setExplanation] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [sourceNote, setSourceNote] = useState("");

  const load = async () => {
    const allDecks = await db.decks.toArray();
    setDecks(allDecks);

    const all = await db.cards.orderBy("createdAt").reverse().toArray();

    let filtered = all;
    if (filterDeck) filtered = filtered.filter((c) => c.deckId === filterDeck);
    if (filterType)
      filtered = filtered.filter((c) => c.cardType === filterType);

    setCards(filtered);
  };

  useEffect(() => {
    load();
  }, [filterDeck, filterType]);

  const resetForm = () => {
    setDeckId(decks[0]?.id || "");
    setSubject("civil");
    setDoctrineId("");
    setCardType("GEN");
    setStatement("");
    setAnswer("O");
    setExplanation("");
    setTagsStr("");
    setSourceNote("");
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!statement.trim() || !deckId) return;
    const now = Date.now();
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingId) {
      await db.cards.update(editingId, {
        deckId,
        subject,
        doctrineId,
        cardType,
        statement: statement.trim(),
        answer,
        explanation: explanation.trim(),
        tags,
        sourceNote: sourceNote.trim() || undefined,
        updatedAt: now,
      });
    } else {
      await db.cards.add({
        id: uuidv4(),
        deckId,
        subject,
        doctrineId,
        cardType,
        statement: statement.trim(),
        answer,
        explanation: explanation.trim(),
        tags,
        sourceNote: sourceNote.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    resetForm();
    setShowForm(false);
    load();
  };

  const handleEdit = (card: Card) => {
    setDeckId(card.deckId);
    setSubject(card.subject);
    setDoctrineId(card.doctrineId);
    setCardType(card.cardType);
    setStatement(card.statement);
    setAnswer(card.answer);
    setExplanation(card.explanation);
    setTagsStr(card.tags.join(", "));
    setSourceNote(card.sourceNote || "");
    setEditingId(card.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 카드를 삭제하시겠습니까?")) return;
    await db.cards.delete(id);
    await db.reviewStates.delete(id);
    load();
  };

  const deckName = (id: string) =>
    decks.find((d) => d.id === id)?.name || "—";

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">카드 관리</h1>
        <button
          onClick={() => {
            if (!showForm) resetForm();
            setShowForm(!showForm);
          }}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "취소" : "+ 새 카드"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <select
          value={filterDeck}
          onChange={(e) => setFilterDeck(e.target.value)}
          className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
        >
          <option value="">전체 덱</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
        >
          <option value="">전체 유형</option>
          {CARD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 space-y-3">
          <select
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">덱 선택</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="civil">민법</option>
              <option value="criminal">형법</option>
              <option value="public">공법</option>
            </select>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value as CardType)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              {CARD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="판례/조문 ID (선택)"
            value={doctrineId}
            onChange={(e) => setDoctrineId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />

          <textarea
            placeholder="지문 (OX 판단 대상)"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setAnswer("O")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                answer === "O"
                  ? "bg-green-500 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              O (맞음)
            </button>
            <button
              onClick={() => setAnswer("X")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                answer === "X"
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              X (틀림)
            </button>
          </div>

          <textarea
            placeholder="해설"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
          />

          <input
            type="text"
            placeholder="태그 (쉼표 구분: 계약, 매매, ...)"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />

          <input
            type="text"
            placeholder="출처 메모 (선택)"
            value={sourceNote}
            onChange={(e) => setSourceNote(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />

          <button
            onClick={handleSave}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {editingId ? "수정" : "추가"}
          </button>
        </div>
      )}

      {/* Card list */}
      <div className="text-xs text-slate-400 mb-2">{cards.length}개 카드</div>
      {cards.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          카드가 없습니다.{" "}
          {decks.length === 0 && "먼저 덱을 만들어주세요."}
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-xs font-bold ${
                        card.answer === "O"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {card.answer}
                    </span>
                    <span className="text-xs text-slate-400">
                      {deckName(card.deckId)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {card.statement}
                  </p>
                  {card.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {card.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(card)}
                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
