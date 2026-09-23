import type { ResourceKey } from "./resources";
export interface EditorField {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "url"
    | "number"
    | "textarea"
    | "checkbox"
    | "select";
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: string[];
  relation?: ResourceKey;
  defaultValue?: string | number | boolean;
}
const name: EditorField = { name: "name", label: "Tên", required: true };
const description: EditorField = {
  name: "description",
  label: "Mô tả",
  type: "textarea",
};
const order: EditorField = {
  name: "order",
  label: "Thứ tự",
  type: "number",
  min: 1,
};
export function editorFields(
  resource: ResourceKey,
  editing: boolean,
): EditorField[] {
  switch (resource) {
    case "users":
      return [
        { ...name, minLength: 5, maxLength: 50 },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "password",
          label: editing ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu",
          type: "password",
          required: !editing,
          minLength: 8,
          maxLength: 50,
          pattern:
            "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\\s]).{8,50}",
        },
        { name: "phone", label: "Số điện thoại Việt Nam" },
        { name: "avatar", label: "URL avatar", type: "url" },
        {
          name: "status",
          label: "Trạng thái",
          type: "select",
          options: ["ACTIVE"],
          defaultValue: "ACTIVE",
          required: true,
        },
      ];
    case "categories":
      return [name, description, order];
    case "learning-paths":
      return [
        name,
        {
          name: "categoryId",
          label: "Danh mục",
          relation: "categories",
          required: true,
        },
        description,
        { name: "thumbnail", label: "URL ảnh đại diện", type: "url" },
        {
          name: "difficulty",
          label: "Độ khó (1–5)",
          type: "number",
          min: 1,
          max: 5,
          defaultValue: 1,
        },
        {
          name: "isActive",
          label: "Hiển thị lộ trình",
          type: "checkbox",
          defaultValue: true,
        },
        ...(editing ? [order] : []),
      ];
    case "word-sets":
      return [
        name,
        ...(!editing
          ? [
              {
                name: "learningPathId",
                label: "Lộ trình học",
                relation: "learning-paths" as const,
                required: true,
              },
            ]
          : []),
        description,
        { name: "isPro", label: "Bộ từ Pro", type: "checkbox" },
        ...(editing ? [order] : []),
      ];
    case "roles":
      return [
        name,
        ...(!editing
          ? [
              {
                name: "code",
                label: "Mã vai trò (A–Z, 0–9, _)",
                required: true,
                pattern: "[A-Z0-9_]+",
              },
            ]
          : []),
        description,
      ];
    case "words":
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
        { name: "audioUrl", label: "URL phát âm", type: "url", maxLength: 191 },
        { name: "note", label: "Ghi chú", type: "textarea", maxLength: 10000 },
      ];
    case "folders":
      return [];
  }
}
export function resourcePayload(
  resource: ResourceKey,
  editing: boolean,
  values: FormData,
  wordSetId?: number,
) {
  const body: Record<string, unknown> = {};
  for (const field of editorFields(resource, editing)) {
    if (field.type === "checkbox") {
      body[field.name] = values.has(field.name);
      continue;
    }
    const raw = String(values.get(field.name) ?? "");
    const value = field.type === "password" ? raw : raw.trim();
    if (!value) {
      if (field.required)
        throw new Error(`Vui lòng nhập ${field.label.toLowerCase()}.`);
      if (resource === "words" && editing) body[field.name] = null;
      else if (field.name === "description" || field.name === "thumbnail")
        body[field.name] = "";
      continue;
    }
    if (field.type === "number" || field.relation) {
      const number = Number(value);
      if (
        !Number.isSafeInteger(number) ||
        number < (field.min ?? 1) ||
        (field.max !== undefined && number > field.max)
      )
        throw new Error(`${field.label} không hợp lệ.`);
      body[field.name] = number;
    } else body[field.name] = value;
  }
  if (resource === "words" && !editing) {
    if (!wordSetId || !Number.isSafeInteger(wordSetId) || wordSetId < 1)
      throw new Error("Vui lòng chọn bộ từ hợp lệ.");
    return { wordSetId, words: [body] };
  }
  return body;
}
