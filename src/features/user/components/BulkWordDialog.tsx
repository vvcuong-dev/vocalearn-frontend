import { useEffect, useRef, useState } from "react";
import { userApi } from "../../../lib/api";
import { Icon } from "../../../components/ui/Icon";
import { useUserQuery } from "../useUserQuery";
import type { WordSet } from "../types";

type Draft = {
  key: number;
  term: string;
  phonetic: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  note: string;
};
type Suggestion = {
  id: number;
  term: string;
  phonetic: string | null;
  meaning: string | null;
  partOfSpeech: string | null;
  example: string | null;
};
const empty = (key: number): Draft => ({
  key,
  term: "",
  phonetic: "",
  meaning: "",
  partOfSpeech: "",
  example: "",
  note: "",
});
const types = ["N", "V", "ADJ", "ADV", "PHRASE", "IDIOM"];

function TermInput({
  row,
  index,
  update,
}: {
  row: Draft;
  index: number;
  update: (patch: Partial<Draft>) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [result, setResult] = useState<{
    query: string;
    items: Suggestion[];
    error?: boolean;
  }>();
  const query = row.term.trim();
  useEffect(() => {
    if (!focused || !query) return;
    let active = true;
    const timer = setTimeout(() => {
      userApi<Suggestion[]>(
        `/dictionary/suggest?q=${encodeURIComponent(query)}`,
        "GET",
        undefined,
        true,
      ).then(
        (items) => {
          if (active) setResult({ query, items });
        },
        () => {
          if (active) setResult({ query, items: [], error: true });
        },
      );
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, focused]);
  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <input
        className="field"
        aria-label={`Từ vựng dòng ${index + 1}`}
        placeholder="Nhập từ tiếng Anh"
        maxLength={191}
        value={row.term}
        onFocus={() => setFocused(true)}
        onChange={(event) => update({ term: event.target.value })}
        autoComplete="off"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            setFocused(false);
          }
        }}
      />
      {focused && query && (
        <div className="dictionary-suggestions" aria-label="Gợi ý từ điển">
          {result?.query !== query ? (
            <p>Đang tìm từ…</p>
          ) : result.error ? (
            <p>Chưa tải được gợi ý. Bạn vẫn có thể nhập thủ công.</p>
          ) : !result.items.length ? (
            <p>Không có gợi ý. Hãy nhập nghĩa bên cạnh.</p>
          ) : (
            result.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  update({
                    term: item.term,
                    phonetic: item.phonetic || "",
                    meaning: item.meaning || "",
                    partOfSpeech: item.partOfSpeech || "",
                    example: item.example || "",
                  });
                  setFocused(false);
                }}
              >
                <strong>{item.term}</strong>
                <span>
                  {item.partOfSpeech} · {item.meaning || "Chưa có nghĩa"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function BulkWordDialog({
  wordSetId,
  name,
  onClose,
  onSaved,
}: {
  wordSetId: number;
  name: string;
  onClose: () => void;
  onSaved: (id: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const nextKey = useRef(1);
  const [rows, setRows] = useState<Draft[]>([empty(0)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sets = useUserQuery<WordSet[]>("/me/word-sets");
  const [target, setTarget] = useState(wordSetId);
  const [created, setCreated] = useState<WordSet[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const options = [
    ...new Map(
      [{ id: wordSetId, name }, ...(sets.data || []), ...created].map((set) => [
        set.id,
        set,
      ]),
    ).values(),
  ];
  const populated = rows.filter((row) =>
    Object.entries(row).some(
      ([key, value]) => key !== "key" && String(value).trim(),
    ),
  );
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  function close() {
    if (!busy && (!populated.length || window.confirm("Bỏ những từ chưa lưu?")))
      onClose();
  }
  async function createSet() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const set = await userApi<WordSet>(
        "/word-sets",
        "POST",
        { name: newName.trim() },
        true,
      );
      setCreated((current) => [...current, set]);
      setTarget(set.id);
      setCreating(false);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo bộ từ.");
    } finally {
      setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !populated.length) return;
    const invalid = rows.findIndex(
      (row) =>
        populated.includes(row) && (!row.term.trim() || !row.meaning.trim()),
    );
    if (invalid >= 0) {
      setError(`Dòng ${invalid + 1}: hãy nhập đủ từ vựng và nghĩa.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await userApi(
        "/words",
        "POST",
        {
          wordSetId: target,
          words: populated.map(
            ({ term, phonetic, meaning, partOfSpeech, example, note }) => ({
              term: term.trim(),
              meaning: meaning.trim(),
              phonetic: phonetic.trim() || null,
              partOfSpeech: partOfSpeech || null,
              example: example.trim() || null,
              note: note.trim() || null,
            }),
          ),
        },
        true,
      );
      onSaved(target);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể lưu từ. Hãy thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className="bulk-word-dialog"
      aria-labelledby="bulk-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <form onSubmit={save}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <h2 id="bulk-title" className="text-xl font-bold">
              Thêm từ vựng
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Chọn gợi ý từ điển hoặc nhập thủ công, rồi chỉnh sửa trước khi lưu.
            </p>
          </div>
          <button
            type="button"
            className="secondary"
            aria-label="Đóng form thêm từ"
            disabled={busy}
            onClick={close}
          >
            <Icon name="close" />
          </button>
        </header>
        <fieldset
          disabled={busy}
          className="flex flex-wrap items-center gap-3 px-6 pt-5"
        >
          <label htmlFor="target-set" className="text-sm font-semibold">
            Thêm vào bộ từ:
          </label>
          <select
            id="target-set"
            className="field max-w-full"
            title={options.find((set) => set.id === target)?.name}
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
          >
            {options.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="secondary"
            onClick={() => setCreating(!creating)}
          >
            + Tạo mới
          </button>
          {creating && (
            <>
              <input
                className="field w-auto!"
                aria-label="Tên bộ từ mới"
                placeholder="Tên bộ từ mới"
                value={newName}
                maxLength={191}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void createSet();
                  }
                }}
              />
              <button
                type="button"
                className="secondary"
                disabled={!newName.trim()}
                onClick={() => void createSet()}
              >
                Tạo bộ từ
              </button>
            </>
          )}
          {sets.error && (
            <p role="status" className="text-sm text-slate-500">
              Chưa tải được các bộ từ khác.{" "}
              <button type="button" className="text-link" onClick={sets.retry}>
                Thử lại
              </button>
            </p>
          )}
        </fieldset>
        {error && (
          <p
            role="alert"
            className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </p>
        )}
        <fieldset disabled={busy} className="min-w-0">
          <div className="bulk-table-scroll">
            <table className="word-table bulk-table">
              <thead>
                <tr>
                  {[
                    "#",
                    "TỪ VỰNG *",
                    "PHIÊN ÂM",
                    "NGHĨA *",
                    "LOẠI TỪ",
                    "VÍ DỤ",
                    "GHI CHÚ",
                    "",
                  ].map((label, i) => (
                    <th key={i}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const update = (patch: Partial<Draft>) =>
                    setRows((current) =>
                      current.map((item) =>
                        item.key === row.key ? { ...item, ...patch } : item,
                      ),
                    );
                  return (
                    <tr key={row.key}>
                      <td>{index + 1}</td>
                      <td>
                        <TermInput row={row} index={index} update={update} />
                      </td>
                      {(
                        [
                          "phonetic",
                          "meaning",
                          "partOfSpeech",
                          "example",
                          "note",
                        ] as const
                      ).map((field) => (
                        <td key={field}>
                          {field === "partOfSpeech" ? (
                            <select
                              className="field"
                              aria-label={`Loại từ dòng ${index + 1}`}
                              value={row[field]}
                              onChange={(event) =>
                                update({ [field]: event.target.value })
                              }
                            >
                              <option value="">Chưa chọn</option>
                              {types.map((type) => (
                                <option key={type}>{type}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="field"
                              aria-label={`${field === "meaning" ? "Nghĩa" : field === "phonetic" ? "Phiên âm" : field === "example" ? "Ví dụ" : "Ghi chú"} dòng ${index + 1}`}
                              placeholder={
                                field === "meaning"
                                  ? "Nghĩa tiếng Việt"
                                  : field === "phonetic"
                                    ? "/…/"
                                    : "Không bắt buộc"
                              }
                              value={row[field]}
                              maxLength={field === "phonetic" ? 191 : 10000}
                              onChange={(event) =>
                                update({ [field]: event.target.value })
                              }
                            />
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          aria-label={`Xóa dòng ${index + 1}`}
                          onClick={() =>
                            setRows((current) =>
                              current.length === 1
                                ? [empty(nextKey.current++)]
                                : current.filter(
                                    (item) => item.key !== row.key,
                                  ),
                            )
                          }
                        >
                          <Icon name="close" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 pb-6">
            <button
              type="button"
              className="secondary w-full border-dashed"
              disabled={rows.length >= 100}
              onClick={() =>
                setRows((current) => [...current, empty(nextKey.current++)])
              }
            >
              + Thêm dòng{" "}
              <span className="font-normal text-slate-400">
                ({rows.length}/100)
              </span>
            </button>
          </div>
        </fieldset>
        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 p-6">
          <span className="text-sm text-slate-500">
            * Bắt buộc · Dòng trống sẽ được bỏ qua
          </span>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={close}
            >
              Hủy
            </button>
            <button
              className="primary w-auto!"
              disabled={busy || !populated.length}
            >
              {busy ? "Đang lưu…" : `Lưu ${populated.length} từ`}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
