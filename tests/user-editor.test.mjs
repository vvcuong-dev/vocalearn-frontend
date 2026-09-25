import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../src/features/user/editor.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { userPayload } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
function form(values) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) =>
    data.set(key, String(value)),
  );
  return data;
}
test("user word-set payload excludes admin-only fields and requires valid parent", () => {
  assert.deepEqual(
    userPayload(
      "word-sets",
      false,
      form({ name: "Travel", isPro: "true", learningPathId: 5, creatorId: 99 }),
      3,
    ),
    { name: "Travel", description: "", folderId: 3 },
  );
  assert.throws(() =>
    userPayload("word-sets", false, form({ name: "Travel" }), -1),
  );
});
test("user word create wraps batch and update clears optional fields", () => {
  assert.deepEqual(
    userPayload("words", false, form({ term: " hello ", meaning: "hi" }), 3),
    { wordSetId: 3, words: [{ term: "hello", meaning: "hi" }] },
  );
  assert.equal(
    userPayload("words", true, form({ term: "hello", meaning: "hi" })).audioUrl,
    null,
  );
  assert.throws(() =>
    userPayload("words", false, form({ term: "hello", meaning: "hi" })),
  );
});
test("folder edit cannot change ownership or visibility in rename payload", () => {
  assert.deepEqual(
    userPayload(
      "folders",
      true,
      form({ name: " Saved ", isPublic: "true", creatorId: 10 }),
    ),
    { name: "Saved" },
  );
});
