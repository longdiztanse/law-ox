"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db, type Deck } from "@/lib/db";

const SUBJECTS = [
  { value: "civil", label: "민법" },
  { value: "criminal", label: "형법" },
  { value: "public", label: "공법" },
  { value: "mixed", label: "혼합" },
] as const;

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckCardCounts, setDeckCardCounts] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<Deck["subject"]>("civil");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const all = await db.decks.orderBy("createdAt").reverse().toArray();
    setDecks(all);
    const counts: Record<string, number> = {};
    for (const deck of all) { counts[deck.id] = await db.cards.where("deckId").equals(deck.id).count(); }
    setDeckCardCounts(counts);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    const now = Date.now();
    if (editingId) {
      await db.decks.update(editingId, { name: name.trim(), subject, updatedAt: now });
    } else {
      await db.decks.add({ id: uuidv4(), name: name.trim(), subject, createdAt: now, updatedAt: now });
    }
    setName(""); setSubject("civil"); setEditingId(null); setShowForm(false); load();
  };

  const handleEdit = (deck: Deck) => { setName(deck.name); setSubject(deck.subject); setEditingId(deck.id); setShowForm(true); };

  const handleDelete = async (id: string) => {
    if (!confirm("이 덱을 삭제하시겠습니까? 포함된 카드도 함께 삭제됩니다.")) return;
    await db.cards.where("deckId").equals(id).delete();
    await db.decks.delete(id); load();
  };

  const subjectLabel = (s: string) => SUBJECTS.find((x) => x.value === s)?.label || s;

  return (
    <div className="px-6 pt-12 pb-32 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 anim-up">
        <h1 className="text-[22px] font-bold" style={{ color: "#111" }}>덱 관리</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setName(""); }}
          className={`px-5 py-2.5 text-[13px] font-bold rounded-2xl active:scale-95 ${showForm ? "btn-outline" : "btn-dark"}`}
        >
          {showForm ? "취소" : "+ 새 덱"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6 anim-slide">
          <input type="text" placeholder="덱 이름" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border rounded-2xl text-[13px] mb-4 bg-white font-medium" style={{ borderColor: "#e0e0e0" }} autoFocus />
          <div className="flex gap-2 mb-5">
            {SUBJECTS.map((s) => (
              <button key={s.value} onClick={() => setSubject(s.value)}
                className={`flex-1 py-2.5 text-[12px] font-bold rounded-2xl active:scale-95 ${subject === s.value ? "btn-dark" : "btn-outline"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={handleSave} className="w-full py-3.5 btn-dark rounded-2xl text-[14px] font-bold">
            {editingId ? "수정" : "추가"}
          </button>
        </div>
      )}

      {/* Deck list */}
      {decks.length === 0 ? (
        <div className="text-center py-20 anim-in">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "#eee" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p className="text-[13px]" style={{ color: "#aaa" }}>아직 덱이 없습니다. 새 덱을 만들어보세요.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {decks.map((deck) => {
            const count = deckCardCounts[deck.id] || 0;
            return (
              <div key={deck.id} className="card p-6 anim-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#f5f5f5" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold" style={{ color: "#111" }}>{deck.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="pill pill-on text-[10px] py-0.5 px-2">{subjectLabel(deck.subject)}</span>
                        <span className="text-[11px]" style={{ color: "#bbb" }}>{count}개 카드</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(deck)} className="p-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(deck.id)} className="p-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
