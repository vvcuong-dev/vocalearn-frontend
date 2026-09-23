import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = readFileSync(
  new URL('../src/features/admin/api/editor.ts', import.meta.url),
  'utf8',
)
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText
const { resourcePayload } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
)
function form(values) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values))
    data.set(key, String(value))
  return data
}

test('category converts ordering to integer and rejects invalid ordering', () => {
  assert.deepEqual(
    resourcePayload('categories', false, form({ name: ' TOEIC ', order: '2' })),
    { name: 'TOEIC', description: '', order: 2 },
  )
  assert.throws(() =>
    resourcePayload('categories', false, form({ name: 'TOEIC', order: '1.5' })),
  )
})
test('learning path sends relation ID and boolean with correct backend types', () => {
  assert.deepEqual(
    resourcePayload(
      'learning-paths',
      false,
      form({
        name: 'Beginner',
        categoryId: '4',
        difficulty: '3',
        isActive: 'on',
      }),
    ),
    {
      name: 'Beginner',
      categoryId: 4,
      description: '',
      thumbnail: '',
      difficulty: 3,
      isActive: true,
    },
  )
  assert.throws(() =>
    resourcePayload(
      'learning-paths',
      false,
      form({ name: 'Beginner', categoryId: '4', difficulty: '6' }),
    ),
  )
})
test('word-set update omits creation-only relation, preserving false isPro', () => {
  assert.deepEqual(
    resourcePayload(
      'word-sets',
      true,
      form({ name: 'Travel', learningPathId: '8', order: '2' }),
    ),
    { name: 'Travel', description: '', isPro: false, order: 2 },
  )
})
test('word creation uses batch API envelope; update omits wordSetId and clears nullable fields', () => {
  assert.deepEqual(
    resourcePayload(
      'words',
      false,
      form({ term: ' hello ', meaning: ' xin chào ' }),
      12,
    ),
    { wordSetId: 12, words: [{ term: 'hello', meaning: 'xin chào' }] },
  )
  assert.deepEqual(
    resourcePayload(
      'words',
      true,
      form({ term: 'hello', meaning: 'xin chào', wordSetId: '12' }),
    ),
    {
      term: 'hello',
      meaning: 'xin chào',
      phonetic: null,
      partOfSpeech: null,
      example: null,
      audioUrl: null,
      note: null,
    },
  )
  assert.throws(() =>
    resourcePayload(
      'words',
      false,
      form({ term: 'hello', meaning: 'xin chào' }),
    ),
  )
})
test('role edit cannot submit immutable code or unexpected fields', () => {
  assert.deepEqual(
    resourcePayload(
      'roles',
      true,
      form({
        name: 'Editor',
        code: 'ADMIN',
        isSystem: 'true',
        permissionCodes: '*',
      }),
    ),
    { name: 'Editor', description: '' },
  )
})
test('user update omits blank password and phone; create requires password', () => {
  const fields = {
    name: 'Test User',
    email: 'test@example.com',
    password: '',
    phone: '',
    status: 'ACTIVE',
  }
  assert.deepEqual(resourcePayload('users', true, form(fields)), {
    name: 'Test User',
    email: 'test@example.com',
    status: 'ACTIVE',
  })
  assert.throws(() => resourcePayload('users', false, form(fields)))
})
