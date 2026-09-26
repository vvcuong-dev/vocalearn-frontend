import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/api.ts", import.meta.url),
  "utf8",
).replace(
  "import.meta.env.VITE_API_URL",
  JSON.stringify("http://localhost:3000/api"),
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
let id = 0;
async function client(saved = new Map()) {
  const data = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
  globalThis.localStorage = {
    getItem: (k) => saved.get(k) ?? null,
    setItem: (k, v) => saved.set(k, v),
    removeItem: (k) => saved.delete(k),
  };
  globalThis.window = new EventTarget();
  return import(
    `data:text/javascript;base64,${Buffer.from(js).toString("base64")}#${id++}`
  );
}
const response = (status, data) =>
  new Response(
    JSON.stringify(
      status < 400 ? { success: true, data } : { success: false, ...data },
    ),
    { status, headers: { "Content-Type": "application/json" } },
  );

test("unwraps backend response and sends JSON credentials", async () => {
  const c = await client();
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith("/admin/auth/login"));
    assert.deepEqual(JSON.parse(options.body), {
      email: "admin@example.com",
      password: "Pass@123",
    });
    return response(200, { tokens: { accessToken: "a", refreshToken: "r" } });
  };
  assert.deepEqual(
    await c.api("/admin/auth/login", "POST", {
      email: "admin@example.com",
      password: "Pass@123",
    }),
    { tokens: { accessToken: "a", refreshToken: "r" } },
  );
});
test("concurrent 401s rotate refresh token only once and retry with new access token", async () => {
  const c = await client();
  c.setTokens({ accessToken: "old", refreshToken: "refresh" });
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("refresh-token")) {
      refreshes++;
      assert.equal(JSON.parse(options.body).refreshToken, "refresh");
      await new Promise((resolve) => setTimeout(resolve, 20));
      return response(200, { accessToken: "new", refreshToken: "rotated" });
    }
    return options.headers.Authorization === "Bearer new"
      ? response(200, { id: 1 })
      : response(401, {});
  };
  const results = await Promise.all([
    c.api("/admin/profile", "GET", undefined, true),
    c.api("/admin/profile", "GET", undefined, true),
  ]);
  assert.deepEqual(results, [{ id: 1 }, { id: 1 }]);
  assert.equal(refreshes, 1);
});
test("invalid refresh clears session and announces expiry", async () => {
  const c = await client();
  c.setTokens({ accessToken: "old", refreshToken: "invalid" });
  let expired = false;
  window.addEventListener("auth-expired", () => {
    expired = true;
  });
  globalThis.fetch = async () => response(401, {});
  await assert.rejects(c.api("/admin/profile", "GET", undefined, true));
  assert.equal(c.hasSession(), false);
  assert.equal(expired, true);
});
test("network failure preserves session for retry", async () => {
  const c = await client();
  c.setTokens({ accessToken: "old", refreshToken: "valid" });
  globalThis.fetch = async () => {
    throw new TypeError("offline");
  };
  await assert.rejects(
    c.api("/admin/profile", "GET", undefined, true),
    /Không kết nối/,
  );
  assert.equal(c.hasSession(), true);
});
test("maps backend validation errors to Vietnamese", async () => {
  const c = await client();
  globalThis.fetch = async () =>
    response(400, { errors: [{ errorCode: "EMAIL_INVALID" }] });
  await assert.rejects(c.api("/admin/auth/login", "POST", {}), (error) => {
    assert.match(error.message, /Email không hợp lệ/);
    assert.equal(error.code, "EMAIL_INVALID");
    return true;
  });
});

test("login stores nested backend tokens and authenticates profile then refresh", async () => {
  const c = await client();
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push(url);
    if (url.endsWith("/login")) {
      return response(200, {
        tokens: { accessToken: "login-access", refreshToken: "login-refresh" },
      });
    }
    if (url.endsWith("/refresh-token")) {
      assert.deepEqual(JSON.parse(options.body), {
        refreshToken: "login-refresh",
      });
      return response(200, {
        accessToken: "renewed-access",
        refreshToken: "renewed-refresh",
      });
    }
    assert.ok(
      ["Bearer login-access", "Bearer renewed-access"].includes(
        options.headers.Authorization,
      ),
    );
    return options.headers.Authorization === "Bearer login-access"
      ? response(401, {})
      : response(200, { id: 1 });
  };
  await c.loginAdmin("admin@example.com", "Pass@123");
  assert.deepEqual(
    JSON.parse(sessionStorage.getItem("vocalearn.admin.session")),
    { accessToken: "login-access", refreshToken: "login-refresh" },
  );
  assert.deepEqual(await c.api("/admin/profile", "GET", undefined, true), {
    id: 1,
  });
  assert.equal(calls.length, 4);
});

test("malformed login response is rejected before sending profile or refresh requests", async () => {
  const c = await client();
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return response(200, { tokens: {} });
  };
  await assert.rejects(c.loginAdmin("admin@example.com", "Pass@123"));
  assert.equal(c.hasSession(), false);
  assert.equal(calls, 1);
});

test("avatar upload preserves multipart body without forcing JSON content type", async () => {
  const c = await client();
  c.setTokens({ accessToken: "access", refreshToken: "refresh" });
  const body = new FormData();
  body.set("avatar", new Blob(["image"], { type: "image/png" }), "avatar.png");
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith("/admin/profile/avatar"));
    assert.equal(options.body, body);
    assert.equal(options.headers["Content-Type"], undefined);
    assert.equal(options.headers.Authorization, "Bearer access");
    return response(200, { id: 1 });
  };
  assert.deepEqual(await c.api("/admin/profile/avatar", "POST", body, true), {
    id: 1,
  });
});

test("user and admin tokens are isolated and user refresh cannot clear admin session", async () => {
  const c = await client();
  c.setTokens({ accessToken: "admin-access", refreshToken: "admin-refresh" });
  c.userClient.setTokens({
    accessToken: "user-access",
    refreshToken: "user-refresh",
  });
  let userExpired = false;
  let adminExpired = false;
  window.addEventListener("user-auth-expired", () => {
    userExpired = true;
  });
  window.addEventListener("auth-expired", () => {
    adminExpired = true;
  });
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/admin/profile")) {
      assert.equal(options.headers.Authorization, "Bearer admin-access");
      return response(200, { id: 10 });
    }
    if (url.endsWith("/auth/refresh-token")) {
      assert.ok(!url.includes("/admin/"));
      assert.deepEqual(JSON.parse(options.body), {
        refreshToken: "user-refresh",
      });
      return response(401, {});
    }
    assert.equal(options.headers.Authorization, "Bearer user-access");
    return response(401, {});
  };
  assert.deepEqual(await c.api("/admin/profile", "GET", undefined, true), {
    id: 10,
  });
  await assert.rejects(c.userApi("/me/profile", "GET", undefined, true));
  assert.equal(c.hasSession(), true);
  assert.equal(c.userClient.hasSession(), false);
  assert.equal(userExpired, true);
  assert.equal(adminExpired, false);
  assert.equal(
    JSON.parse(sessionStorage.getItem("vocalearn.admin.session")).accessToken,
    "admin-access",
  );
});

test("user login consumes nested token response and authenticates user requests", async () => {
  const c = await client();
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/auth/login"))
      return response(200, {
        tokens: { accessToken: "user-a", refreshToken: "user-r" },
      });
    assert.equal(options.headers.Authorization, "Bearer user-a");
    return response(200, { id: 2 });
  };
  await c.userClient.login("user@example.com", "Pass@123");
  assert.equal(c.hasSession(), false);
  assert.deepEqual(await c.userApi("/me/profile", "GET", undefined, true), {
    id: 2,
  });
});

test("remembered user session survives browser restart and persists rotated tokens", async () => {
  const saved = new Map();
  const c = await client(saved);
  globalThis.fetch = async () => response(200, { tokens: { accessToken: "old", refreshToken: "refresh" } });
  await c.userClient.login("user@example.com", "Pass@123", true);
  assert.equal(sessionStorage.getItem("vocalearn.user.session"), null);
  const reopened = await client(saved);
  assert.equal(reopened.userClient.hasSession(), true);
  assert.equal(reopened.hasSession(), false);
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("refresh-token")) {
      assert.equal(JSON.parse(options.body).refreshToken, "refresh");
      return response(200, { accessToken: "new", refreshToken: "rotated" });
    }
    return options.headers.Authorization === "Bearer new" ? response(200, { id: 2 }) : response(401, {});
  };
  assert.deepEqual(await reopened.userApi("/me/profile", "GET", undefined, true), { id: 2 });
  assert.equal(JSON.parse(saved.get("vocalearn.user.session")).refreshToken, "rotated");
});

test("unchecked remember removes previous persistence and tab session does not survive restart", async () => {
  const saved = new Map();
  const c = await client(saved);
  globalThis.fetch = async () => response(200, { tokens: { accessToken: "a", refreshToken: "r" } });
  await c.userClient.login("user@example.com", "Pass@123", true);
  await c.userClient.login("user@example.com", "Pass@123", false);
  assert.equal(saved.has("vocalearn.user.session"), false);
  assert.ok(sessionStorage.getItem("vocalearn.user.session"));
  assert.equal((await client(saved)).userClient.hasSession(), false);
});

test("logout clears remembered user tokens without clearing admin session", async () => {
  const saved = new Map();
  const c = await client(saved);
  c.setTokens({ accessToken: "admin", refreshToken: "admin-r" });
  c.userClient.setTokens({ accessToken: "user", refreshToken: "user-r" }, true);
  c.userClient.setTokens(null);
  assert.equal(saved.has("vocalearn.user.session"), false);
  assert.equal(sessionStorage.getItem("vocalearn.user.session"), null);
  assert.equal(c.hasSession(), true);
  assert.equal((await client(saved)).userClient.hasSession(), false);
});

test("expired remembered refresh is removed but network failure preserves it", async () => {
  const saved = new Map();
  const c = await client(saved);
  c.userClient.setTokens({ accessToken: "old", refreshToken: "r" }, true);
  globalThis.fetch = async () => { throw new TypeError("offline"); };
  await assert.rejects(c.userApi("/me/profile", "GET", undefined, true));
  assert.equal(saved.has("vocalearn.user.session"), true);
  globalThis.fetch = async () => response(401, {});
  await assert.rejects(c.userApi("/me/profile", "GET", undefined, true));
  assert.equal(saved.has("vocalearn.user.session"), false);
  assert.equal(c.userClient.hasSession(), false);
});
