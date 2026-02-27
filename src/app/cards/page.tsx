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
  const [filterDeck, setFilterDeck] = useState("");
  const [filterType, setFilterType] = useState("");

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
    if (filterType) filtered = filtered.filter((c) => c.cardType === filterType);
    setCards(filtered);
  };

  useEffect(() => { load(); }, [filterDeck, filterType]);

  const resetForm = () => {
    setDeckId(decks[0]?.id || ""); setSubject("civil"); setDoctrineId("");
    setCardType("GEN"); setStatement(""); setAnswer("O");
    setExplanation(""); setTagsStr(""); setSourceNote(""); setEditingId(null);
  };

  const handleSave = async () => {
    if (!statement.trim() || !deckId) return;
    const now = Date.now();
    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
    if (editingId) {
      await db.cards.update(editingId, { deckId, subject, doctrineId, cardType, statement: statement.trim(), answer, explanation: explanation.trim(), tags, sourceNote: sourceNote.trim() || undefined, updatedAt: now });
    } else {
      await db.cards.add({ id: uuidv4(), deckId, subject, doctrineId, cardType, statement: statement.trim(), answer, explanation: explanation.trim(), tags, sourceNote: sourceNote.trim() || undefined, createdAt: now, updatedAt: now });
    }
    resetForm(); setShowForm(false); load();
  };

  const handleEdit = (card: Card) => {
    setDeckId(card.deckId); setSubject(card.subject); setDoctrineId(card.doctrineId);
    setCardType(card.cardType); setStatement(card.statement); setAnswer(card.answer);
    setExplanation(card.explanation); setTagsStr(card.tags.join(", "));
    setSourceNote(card.sourceNote || ""); setEditingId(card.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 카드를 삭제하시겠습니까?")) return;
    await db.cards.delete(id); await db.reviewStates.delete(id); load();
  };

  const deckName = (id: string) => decks.find((d) => d.id === id)?.name || "—";

  return (
    <div className="px-6 pt-8 pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 anim-up">
        <h1 className="text-[22px] font-bold" style={{ color: "#111" }}>카드 관리</h1>
        <button
          onClick={() => { if (!showForm) resetForm(); setShowForm(!showForm); }}
          className={`px-5 py-2.5 text-[13px] font-bold rounded-2xl active:scale-95 ${showForm ? "btn-outline" : "btn-dark"}`}
        >
          {showForm ? "취소" : "+ 새 카드"}
        </button>
      </div>

      {/* Filters (3번 사진 - pill 태그) */}
      <div className="flex gap-2 mb-6 overflow-x-auto anim-up" style={{ animationDelay: "50ms" }}>
        <select
          value={filterDeck}
          onChange={(e) => setFilterDeck(e.target.value)}
          className="pill pill-off text-[12px] cursor-pointer appearance-none pr-6"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
        >
          <option value="">전체 덱</option>
          {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="pill pill-off text-[12px] cursor-pointer appearance-none pr-6"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
        >
          <option value="">전체 유형</option>
          {CARD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6 space-y-4 anim-slide">
          <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className="w-full px-4 py-3 border rounded-2xl text-[13px] font-medium bg-white" style={{ borderColor: "#e0e0e0" }}>
            <option value="">덱 선택</option>
            {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div className="flex gap-3">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 px-4 py-3 border rounded-2xl text-[13px] font-medium bg-white" style={{ borderColor: "#e0e0e0" }}>
              <option value="civil">민법</option>
              <option value="criminal">형법</option>
              <option value="public">공법</option>
            </select>
            <select value={cardType} onChange={(e) => setCardType(e.target.value as CardType)} className="flex-1 px-4 py-3 border rounded-2xl text-[13px] font-medium bg-white" style={{ borderColor: "#e0e0e0" }}>
              {CARD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <input type="text" placeholder="판례/조문 ID (선택)" value={doctrineId} onChange={(e) => setDoctrineId(e.target.value)} className="w-full px-4 py-3 border rounded-2xl text-[13px] bg-white" style={{ borderColor: "#e0e0e0" }} />

          <textarea placeholder="지문 (OX 판단 대상)" value={statement} onChange={(e) => setStatement(e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-2xl text-[13px] resize-none bg-white" style={{ borderColor: "#e0e0e0" }} />

          <div className="flex gap-3">
            <button onClick={() => setAnswer("O")}
              className={`flex-1 py-3 rounded-2xl text-[13px] font-bold active:scale-95 ${answer === "O" ? "btn-dark" : "btn-outline"}`}>
              O (맞음)
            </button>
            <button onClick={() => setAnswer("X")}
              className={`flex-1 py-3 rounded-2xl text-[13px] font-bold active:scale-95 ${answer === "X" ? "btn-dark" : "btn-outline"}`}>
              X (틀림)
            </button>
          </div>

          <textarea placeholder="해설" value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="w-full px-4 py-3 border rounded-2xl text-[13px] resize-none bg-white" style={{ borderColor: "#e0e0e0" }} />
          <input type="text" placeholder="태그 (쉼표 구분)" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} className="w-full px-4 py-3 border rounded-2xl text-[13px] bg-white" style={{ borderColor: "#e0e0e0" }} />
          <input type="text" placeholder="출처 메모 (선택)" value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} className="w-full px-4 py-3 border rounded-2xl text-[13px] bg-white" style={{ borderColor: "#e0e0e0" }} />

          <button onClick={handleSave} className="w-full py-3.5 btn-dark rounded-2xl text-[14px] font-bold">
            {editingId ? "수정" : "추가"}
          </button>
        </div>
      )}

      {/* Count */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[12px] font-semibold" style={{ color: "#aaa" }}>{cards.length}개 카드</span>
        <div className="flex-1 h-px" style={{ background: "#eee" }} />
      </div>

      {/* Card list (3번 사진 스타일 - 큰 카드) */}
      {cards.length === 0 ? (
        <div className="text-center py-20 anim-in">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "#eee" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <p className="text-[13px]" style={{ color: "#aaa" }}>
            카드가 없습니다. {decks.length === 0 && "먼저 덱을 만들어주세요."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {cards.map((card) => (
            <div key={card.id} className="card p-5 anim-up">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-[13px] font-bold" style={{ background: "#f0f0f0", color: "#111" }}>
                      {card.answer}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: "#bbb" }}>{deckName(card.deckId)}</span>
                  </div>
                  <p className="text-[14px] leading-relaxed line-clamp-2 break-keep" style={{ color: "#333" }}>
                    {card.statement}
                  </p>
                  {card.tags.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {card.tags.map((t) => (
                        <span key={t} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg" style={{ background: "#f5f5f5", color: "#888" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(card)} className="p-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(card.id)} className="p-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
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
