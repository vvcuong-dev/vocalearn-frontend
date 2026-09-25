import { useState } from "react";
import type { Word } from "../types";
export function Flashcards({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = words[index];
  if (!word) return <p className="text-slate-500">Chưa có từ để ôn tập.</p>;
  function move(step: number) {
    setIndex(index + step);
    setFlipped(false);
  }
  return (
    <section className="mb-8 rounded-3xl border border-teal-100 bg-teal-50 p-6">
      <div className="mb-4 flex justify-between text-xs text-teal-800">
        <span>ÔN TẬP CÁC TỪ TRÊN TRANG NÀY</span>
        <span>
          {index + 1} / {words.length}
        </span>
      </div>
      <button
        aria-label="Lật thẻ từ"
        aria-pressed={flipped}
        onClick={() => setFlipped(!flipped)}
        className="flex min-h-56 w-full flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm"
      >
        <span className="text-3xl font-bold">
          {flipped ? word.meaning : word.term}
        </span>
        <span className="mt-4 text-sm text-slate-400">
          {flipped ? word.example || word.note : word.phonetic}
        </span>
        <span className="mt-6 text-xs text-teal-600">
          Nhấn để {flipped ? "xem từ" : "xem nghĩa"}
        </span>
      </button>
      <div className="mt-4 flex justify-center gap-3">
        <button
          className="secondary"
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          Từ trước
        </button>
        <button
          className="secondary"
          disabled={index === words.length - 1}
          onClick={() => move(1)}
        >
          Từ tiếp theo
        </button>
      </div>
    </section>
  );
}
