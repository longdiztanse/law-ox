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
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<Deck["subject"]>("civil");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const all = await db.decks.orderBy("createdAt").reverse().toArray();
    setDecks(all);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    const now = Date.now();

    if (editingId) {
      await db.decks.update(editingId, {
        name: name.trim(),
        subject,
        updatedAt: now,
      });
    } else {
      await db.decks.add({
        id: uuidv4(),
        name: name.trim(),
        subject,
        createdAt: now,
        updatedAt: now,
      });
    }

    setName("");
    setSubject("civil");
    setEditingId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (deck: Deck) => {
    setName(deck.name);
    setSubject(deck.subject);
    setEditingId(deck.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 덱을 삭제하시겠습니까? 포함된 카드도 함께 삭제됩니다."))
      return;
    await db.cards.where("deckId").equals(id).delete();
    await db.decks.delete(id);
    load();
  };

  const subjectLabel = (s: string) =>
    SUBJECTS.find((x) => x.value === s)?.label || s;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">덱 관리</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setName("");
          }}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "취소" : "+ 새 덱"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
          <input
            type="text"
            placeholder="덱 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2 mb-3">
            {SUBJECTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSubject(s.value)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  subject === s.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {editingId ? "수정" : "추가"}
          </button>
        </div>
      )}

      {decks.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          아직 덱이 없습니다. 새 덱을 만들어보세요.
        </div>
      ) : (
        <div className="space-y-2">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-slate-800">{deck.name}</h3>
                <span className="text-xs text-slate-400">
                  {subjectLabel(deck.subject)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(deck)}
                  className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(deck.id)}
                  className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
