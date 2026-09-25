export type UserResource = "folders" | "word-sets" | "words";
export interface UserField {
  name: string;
  label: string;
  required?: boolean;
  type?: "textarea" | "url" | "select" | "number";
  options?: string[];
  maxLength?: number;
}
export function fieldsFor(
  resource: UserResource,
  editing: boolean,
): UserField[] {
  if (resource === "folders")
    return [{ name: "name", label: "Tên thư mục", required: true }];
  if (resource === "word-sets")
    return [
      { name: "name", label: "Tên bộ từ", required: true },
      { name: "description", label: "Mô tả", type: "textarea" },
      ...(editing
        ? [{ name: "order", label: "Thứ tự", type: "number" as const }]
        : []),
    ];
  return [
    { name: "term", label: "Từ / cụm từ", required: true, maxLength: 191 },
    {
      name: "meaning",
      label: "Nghĩa",
      type: "textarea",
      required: true,
      maxLength: 10000,
    },
    { name: "phonetic", label: "Phiên âm", maxLength: 191 },
    {
      name: "partOfSpeech",
      label: "Từ loại",
      type: "select",
      options: ["N", "V", "ADJ", "ADV", "PHRASE", "IDIOM"],
    },
    { name: "example", label: "Ví dụ", type: "textarea", maxLength: 10000 },
    { name: "audioUrl", label: "URL âm thanh", type: "url", maxLength: 191 },
    { name: "note", label: "Ghi chú", type: "textarea", maxLength: 10000 },
  ];
}
export function userPayload(
  resource: UserResource,
  editing: boolean,
  form: FormData,
  parentId?: number,
) {
  const data: Record<string, unknown> = {};
  for (const field of fieldsFor(resource, editing)) {
    const value = String(form.get(field.name) || "").trim();
    if (field.required && !value)
      throw new Error(`Vui lòng nhập ${field.label.toLowerCase()}.`);
    if (!value) {
      if (resource === "words" && editing) data[field.name] = null;
      else if (field.name === "description") data.description = "";
      continue;
    }
    if (field.type === "number") {
      const n = Number(value);
      if (!Number.isSafeInteger(n) || n < 1)
        throw new Error("Thứ tự phải là số nguyên dương.");
      data[field.name] = n;
    } else data[field.name] = value;
  }
  if (
    parentId !== undefined &&
    (!Number.isSafeInteger(parentId) || parentId < 1)
  )
    throw new Error("Thư mục hoặc bộ từ không hợp lệ.");
  if (!editing && resource === "words") {
    if (!parentId) throw new Error("Chọn bộ từ trước khi thêm từ.");
    return { wordSetId: parentId, words: [data] };
  }
  if (!editing && resource === "word-sets" && parentId)
    data.folderId = parentId;
  return data;
}
