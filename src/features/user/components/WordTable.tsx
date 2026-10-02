import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { DeleteAction } from "./DeleteAction";
import type { Word } from "../types";

function Pronunciation({ term, src }: { term: string; src: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  async function toggle() {
    if (!audio.current) return;
    setFailed(false);
    if (!audio.current.paused) audio.current.pause();
    else {
      try {
        await audio.current.play();
      } catch {
        setFailed(true);
      }
    }
  }
  return (
    <>
      <button
        type="button"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-teal-600 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-brand"
        aria-label={`${playing ? "Dừng" : "Phát âm"} ${term}`}
        onClick={() => void toggle()}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m11 5-6 4H2v6h3l6 4V5Z" />
          {playing ? (
            <path d="M16 8v8m4-8v8" />
          ) : (
            <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
          )}
        </svg>
      </button>
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
      />
      {failed && (
        <span role="status" className="text-xs text-red-600">
          Không phát được âm thanh.
        </span>
      )}
    </>
  );
}

export function WordTable({
  words,
  editable,
  onDeleted,
}: {
  words: Word[];
  editable: boolean;
  onDeleted: () => void;
}) {
  if (!words.length)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
        <h2 className="font-semibold">Chưa có từ vựng phù hợp</h2>
        <p className="mt-2 text-sm text-slate-500">
          Thêm từ mới hoặc thay đổi nội dung tìm kiếm.
        </p>
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="word-table">
        <thead>
          <tr>
            <th>TỪ VỰNG</th>
            <th>NGHĨA</th>
            <th>LOẠI TỪ</th>
            <th>VÍ DỤ / GHI CHÚ</th>
            {editable && (
              <th>
                <span className="sr-only">Thao tác</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <tr key={word.id}>
              <td>
                <div className="flex items-center gap-1">
                  {word.audioUrl && /^https?:\/\//.test(word.audioUrl) && (
                    <Pronunciation
                      key={word.audioUrl}
                      term={word.term}
                      src={word.audioUrl}
                    />
                  )}
                  <strong>{word.term}</strong>
                </div>
                <p className="mt-1 text-xs text-slate-500">{word.phonetic}</p>
              </td>
              <td className="whitespace-pre-wrap">{word.meaning}</td>
              <td>
                {word.partOfSpeech ? (
                  <span className={`pos-badge pos-${word.partOfSpeech}`}>
                    {word.partOfSpeech}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="max-w-xs whitespace-pre-wrap text-sm text-slate-500">
                {word.example || "—"}
                {word.note && <p className="mt-2 text-teal-700">{word.note}</p>}
              </td>
              {editable && (
                <td>
                  <div className="flex gap-2">
                    <Link
                      className="secondary"
                      aria-label={`Sửa ${word.term}`}
                      to={`/learn/words/${word.id}/edit`}
                    >
                      Sửa
                    </Link>
                    <DeleteAction
                      path={`/words/${word.id}`}
                      name={word.term}
                      onDeleted={onDeleted}
                    />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
