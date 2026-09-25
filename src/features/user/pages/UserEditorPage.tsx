import { useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { userApi } from "../../../lib/api";
import { PageHeading } from "../../../components/ui/PageHeading";
import { QueryState } from "../../../components/ui/QueryState";
import { useUserQuery } from "../useUserQuery";
import { useUserAuth } from "../auth/context";
import { fieldsFor, userPayload, type UserResource } from "../editor";
import type { WordSet } from "../types";
export function UserEditorPage({ resource }: { resource: UserResource }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useUserAuth();
  const detail = useUserQuery<Record<string, unknown>>(
    id ? `/${resource}/${id}` : null,
  );
  const parentId =
    Number(
      resource === "words"
        ? detail.data?.wordSetId || params.get("wordSetId")
        : params.get("folderId"),
    ) || undefined;
  const parent = useUserQuery<WordSet>(
    resource === "words" && parentId ? `/word-sets/${parentId}` : null,
  );
  if (detail.loading || detail.error) return <QueryState {...detail} />;
  if (parent.loading || parent.error) return <QueryState {...parent} />;
  const own =
    !id ||
    (resource === "folders"
      ? detail.data?.creatorId === user?.id
      : resource === "word-sets"
        ? (detail.data?.creator as { id: number } | undefined)?.id === user?.id
        : parent.data?.creator?.id === user?.id);
  if (
    !own ||
    (resource === "words" &&
      parent.data &&
      (parent.data.creator?.id !== user?.id || parent.data.learningPath))
  )
    return (
      <p role="alert">Bạn chỉ được chỉnh sửa nội dung thuộc sở hữu của mình.</p>
    );
  if (resource === "words" && !parentId)
    return (
      <Link className="text-link" to="/learn/library">
        Chọn bộ từ trước khi thêm từ
      </Link>
    );
  return (
    <Editor
      key={`${resource}:${id || "new"}:${parentId}`}
      resource={resource}
      id={id}
      initial={detail.data || {}}
      parentId={parentId}
    />
  );
}
function Editor({
  resource,
  id,
  initial,
  parentId,
}: {
  resource: UserResource;
  id?: string;
  initial: Record<string, unknown>;
  parentId?: number;
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const back =
    resource === "words"
      ? `/learn/word-sets/${parentId}`
      : id
        ? `/learn/${resource}/${id}`
        : resource === "word-sets" && parentId
          ? `/learn/folders/${parentId}`
          : "/learn/library";
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await userApi<{ id: number }>(
        `/${resource}${id ? `/${id}` : ""}`,
        id ? "PATCH" : "POST",
        userPayload(
          resource,
          !!id,
          new FormData(event.currentTarget),
          parentId,
        ),
        true,
      );
      navigate(resource === "words" ? back : `/learn/${resource}/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu nội dung.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title={`${id ? "Chỉnh sửa" : "Tạo mới"} ${resource === "folders" ? "thư mục" : resource === "words" ? "từ vựng" : "bộ từ"}`}
        description={
          parentId
            ? `Trong ${resource === "words" ? "bộ từ" : "thư mục"} #${parentId}`
            : "Thêm một góc kiến thức vào thư viện của bạn."
        }
        action={
          <Link className="secondary" to={back}>
            Quay lại
          </Link>
        }
      />
      <form
        onSubmit={save}
        className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-7"
      >
        {error && (
          <div className="mb-5">
            <QueryState error={error} />
          </div>
        )}
        <fieldset disabled={busy} className="space-y-5">
          {fieldsFor(resource, !!id).map((field) => {
            const value = initial[field.name];
            const common = {
              name: field.name,
              id: field.name,
              className: "field",
              required: field.required,
              defaultValue:
                typeof value === "string" || typeof value === "number"
                  ? value
                  : "",
            };
            return (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-semibold"
                >
                  {field.label}
                  {field.required && " *"}
                </label>
                {field.type === "textarea" ? (
                  <textarea {...common} rows={4} maxLength={field.maxLength} />
                ) : field.type === "select" ? (
                  <select {...common}>
                    <option value="">Chọn từ loại</option>
                    {field.options?.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={field.type || "text"}
                    min={field.type === "number" ? 1 : undefined}
                    step={field.type === "number" ? 1 : undefined}
                    maxLength={field.maxLength}
                  />
                )}
              </div>
            );
          })}
          <button className="primary" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu nội dung"}
          </button>
        </fieldset>
      </form>
    </>
  );
}
