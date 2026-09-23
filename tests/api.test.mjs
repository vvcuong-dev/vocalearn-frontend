import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(
  new URL('../src/lib/api.ts', import.meta.url),
  'utf8',
).replace('import.meta.env.VITE_API_URL', 'undefined')
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText
let id = 0
async function client() {
  const data = new Map()
  globalThis.sessionStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  }
  globalThis.window = new EventTarget()
  return import(
    `data:text/javascript;base64,${Buffer.from(js).toString('base64')}#${id++}`
  )
}
const response = (status, data) =>
  new Response(
    JSON.stringify(
      status < 400 ? { success: true, data } : { success: false, ...data },
    ),
    { status, headers: { 'Content-Type': 'application/json' } },
  )

test('unwraps backend response and sends JSON credentials', async () => {
  const c = await client()
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/admin/auth/login'))
    assert.deepEqual(JSON.parse(options.body), {
      email: 'admin@example.com',
      password: 'Pass@123',
    })
    return response(200, { tokens: { accessToken: 'a', refreshToken: 'r' } })
  }
  assert.deepEqual(
    await c.api('/admin/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'Pass@123',
    }),
    { tokens: { accessToken: 'a', refreshToken: 'r' } },
  )
})
test('concurrent 401s rotate refresh token only once and retry with new access token', async () => {
  const c = await client()
  c.setTokens({ accessToken: 'old', refreshToken: 'refresh' })
  let refreshes = 0
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('refresh-token')) {
      refreshes++
      assert.equal(JSON.parse(options.body).refreshToken, 'refresh')
      await new Promise((resolve) => setTimeout(resolve, 20))
      return response(200, { accessToken: 'new', refreshToken: 'rotated' })
    }
    return options.headers.Authorization === 'Bearer new'
      ? response(200, { id: 1 })
      : response(401, {})
  }
  const results = await Promise.all([
    c.api('/admin/profile', 'GET', undefined, true),
    c.api('/admin/profile', 'GET', undefined, true),
  ])
  assert.deepEqual(results, [{ id: 1 }, { id: 1 }])
  assert.equal(refreshes, 1)
})
test('invalid refresh clears session and announces expiry', async () => {
  const c = await client()
  c.setTokens({ accessToken: 'old', refreshToken: 'invalid' })
  let expired = false
  window.addEventListener('auth-expired', () => {
    expired = true
  })
  globalThis.fetch = async () => response(401, {})
  await assert.rejects(c.api('/admin/profile', 'GET', undefined, true))
  assert.equal(c.hasSession(), false)
  assert.equal(expired, true)
})
test('network failure preserves session for retry', async () => {
  const c = await client()
  c.setTokens({ accessToken: 'old', refreshToken: 'valid' })
  globalThis.fetch = async () => {
    throw new TypeError('offline')
  }
  await assert.rejects(
    c.api('/admin/profile', 'GET', undefined, true),
    /Không kết nối/,
  )
  assert.equal(c.hasSession(), true)
})
test('maps backend validation errors to Vietnamese', async () => {
  const c = await client()
  globalThis.fetch = async () =>
    response(400, { errors: [{ errorCode: 'EMAIL_INVALID' }] })
  await assert.rejects(
    c.api('/admin/auth/login', 'POST', {}),
    /Email không hợp lệ/,
  )
})

test('login stores nested backend tokens and authenticates profile then refresh', async () => {
  const c = await client()
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push(url)
    if (url.endsWith('/login')) {
      return response(200, {
        tokens: { accessToken: 'login-access', refreshToken: 'login-refresh' },
      })
    }
    if (url.endsWith('/refresh-token')) {
      assert.deepEqual(JSON.parse(options.body), {
        refreshToken: 'login-refresh',
      })
      return response(200, {
        accessToken: 'renewed-access',
        refreshToken: 'renewed-refresh',
      })
    }
    assert.ok(
      ['Bearer login-access', 'Bearer renewed-access'].includes(
        options.headers.Authorization,
      ),
    )
    return options.headers.Authorization === 'Bearer login-access'
      ? response(401, {})
      : response(200, { id: 1 })
  }
  await c.loginAdmin('admin@example.com', 'Pass@123')
  assert.deepEqual(
    JSON.parse(sessionStorage.getItem('vocalearn.admin.session')),
    { accessToken: 'login-access', refreshToken: 'login-refresh' },
  )
  assert.deepEqual(await c.api('/admin/profile', 'GET', undefined, true), {
    id: 1,
  })
  assert.equal(calls.length, 4)
})

test('malformed login response is rejected before sending profile or refresh requests', async () => {
  const c = await client()
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    return response(200, { tokens: {} })
  }
  await assert.rejects(c.loginAdmin('admin@example.com', 'Pass@123'))
  assert.equal(c.hasSession(), false)
  assert.equal(calls, 1)
})
