import { useEffect, useId, useState } from "react";
import { userApi } from "../../../lib/api";
import { dictionaryConfig, dictionaryQuery } from "../../../configs/dictionary.config";

type Field = "term" | "phonetic" | "meaning" | "example";
type Entry = {
  id: number;
  term: string;
  phonetic: string | null;
  meaning: string | null;
  example: string | null;
  audioUrl?: string | null;
};
const labels: Record<Field, string> = {
  term: "Từ vựng",
  phonetic: "Phiên âm",
  meaning: "Nghĩa",
  example: "Ví dụ",
};
const placeholders: Record<Field, string> = {
  term: "Nhập từ tiếng Anh",
  phonetic: "/…/",
  meaning: "Nghĩa tiếng Việt",
  example: "Không bắt buộc",
};

export function DictionaryField({
  field,
  term,
  value,
  index,
  onChange,
}: {
  field: Field;
  term: string;
  value: string;
  index: number;
  onChange: (value: string, audioUrl?: string | null) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [result, setResult] = useState<{
    key: string;
    values: string[];
    audioUrl?: string | null;
    error?: boolean;
  }>();
  const query = term.trim();
  const key = `${field}:${query}`;
  useEffect(() => {
    if (!open || !query) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        let entry: Entry | null = null;
        const values =
          field === "term"
            ? (
                await userApi<Entry[]>(
                  dictionaryQuery(dictionaryConfig.suggestPath, query),
                  "GET",
                  undefined,
                  true,
                )
              ).map((entry) => entry.term)
            : [
                (entry =
                  await userApi<Entry | null>(
                    dictionaryQuery(dictionaryConfig.lookupPath, query),
                    "GET",
                    undefined,
                    true,
                  )
                )?.[field],
              ].filter((item): item is string => !!item);
        if (active)
          setResult({ key, values: [...new Set(values)], audioUrl: entry?.audioUrl });
      } catch {
        if (active) setResult({ key, values: [], error: true });
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query, key, field]);
  const values =
    result?.key === key
      ? result.values.filter(
          (item) =>
            field === "term" ||
            !value.trim() ||
            item.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase()),
        )
      : [];
  const expanded = open && !!query;
  function choose(next: string) {
    onChange(next, field === "phonetic" ? result?.audioUrl ?? null : undefined);
    setOpen(false);
    setActiveIndex(-1);
  }
  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <input
        className="field"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
        aria-activedescendant={
          expanded && values[activeIndex] ? `${id}-${activeIndex}` : undefined
        }
        aria-label={`${labels[field]} dòng ${index + 1}`}
        placeholder={placeholders[field]}
        maxLength={field === "term" || field === "phonetic" ? 191 : 10000}
        autoComplete="off"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) =>
              values.length
                ? (current +
                    (event.key === "ArrowDown" ? 1 : values.length - 1) +
                    values.length) %
                  values.length
                : -1,
            );
          }
          if (event.key === "Enter" && expanded && values[activeIndex]) {
            event.preventDefault();
            choose(values[activeIndex]);
          }
        }}
      />
      {expanded && (
        <div
          className="dictionary-suggestions dictionary-field-suggestions"
          id={id}
          role="listbox"
          aria-label={`Gợi ý ${labels[field].toLowerCase()}`}
        >
          {result?.key !== key ? (
            <p role="status">Đang tìm…</p>
          ) : result.error ? (
            <p role="status">Chưa tải được gợi ý. Bạn có thể nhập thủ công.</p>
          ) : !values.length ? (
            <p role="status">
              Chưa có gợi ý phù hợp. Bạn có thể nhập thủ công.
            </p>
          ) : (
            values.map((item, itemIndex) => (
              <button
                id={`${id}-${itemIndex}`}
                role="option"
                aria-selected={activeIndex === itemIndex}
                type="button"
                key={item}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                {item}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
