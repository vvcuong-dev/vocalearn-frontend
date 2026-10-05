import { useState } from "react";
import { pronunciationSourceUrl } from "../../../configs/dictionary.config";

export function DictionaryAudio({
  value,
  index,
  onChange,
}: {
  value: string;
  index: number;
  onChange: (url: string) => void;
}) {
  const [message, setMessage] = useState("");
  if (!value) return null;
  const source = pronunciationSourceUrl(value);
  return (
    <div className="mt-2 space-y-1">
      <audio
        className="h-8 w-full min-w-0"
        controls
        src={value}
        preload="none"
        aria-label={`Nghe phát âm dòng ${index + 1}`}
        onError={() =>
          setMessage(
            "Không phát được file. Bạn có thể bỏ âm thanh.",
          )
        }
      />
      <div className="flex flex-wrap gap-2 text-xs">
        {source && (
          <a
            className="text-link"
            href={source}
            target="_blank"
            rel="noreferrer"
          >
            Nguồn / giấy phép
          </a>
        )}
        <button
          type="button"
          className="text-link"
          aria-label={`Bỏ âm thanh dòng ${index + 1}`}
          onClick={() => {
            onChange("");
            setMessage("");
          }}
        >
          Bỏ
        </button>
      </div>
      {message && (
        <p role="status" className="text-xs text-slate-500">
          {message}
        </p>
      )}
    </div>
  );
}
