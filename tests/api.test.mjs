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
async function client() {
  const storage = () => {
    const data = new Map([
      ["vocalearn.admin.session", "legacy"],
      ["vocalearn.user.session", "legacy"],
    ]);
    return {
      getItem: (key) => data.get(key) ?? null,
      removeItem: (key) => data.delete(key),
      setItem: () => {
        throw new Error("Tokens must not be written to storage");
      },
    };
  };
  globalThis.window = Object.assign(new EventTarget(), {
    localStorage: storage(),
    sessionStorage: storage(),
  });
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

test("login includes credentials, CSRF header and remember flag; only access token is kept in memory", async () => {
  const c = await client();
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith("/admin/auth/login"));
    assert.equal(options.credentials, "include");
    assert.equal(options.headers["X-CSRF-Protection"], "1");
    assert.deepEqual(JSON.parse(options.body), {
      email: "admin@example.com",
      password: "Pass@123",
      remember: true,
    });
    return response(200, { accessToken: "access" });
  };
  await c.loginAdmin("admin@example.com", "Pass@123");
  assert.equal(c.hasSession(), true);
  assert.equal(window.localStorage.getItem("vocalearn.admin.session"), null);
  assert.equal(window.sessionStorage.getItem("vocalearn.admin.session"), null);
});

test("new tab restores by sending cookie credentials with no refresh token body", async () => {
  const c = await client();
  assert.equal(c.hasSession(), false);
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith("/admin/auth/refresh-token"));
    assert.equal(options.credentials, "include");
    assert.equal(options.body, undefined);
    return response(200, { accessToken: "restored" });
  };
  assert.equal(await c.restoreSession(), true);
  globalThis.fetch = async (_, options) => {
    assert.equal(options.headers.Authorization, "Bearer restored");
    return response(200, { id: 1 });
  };
  assert.deepEqual(await c.api("/admin/profile", "GET", undefined, true), {
    id: 1,
  });
});

test("concurrent 401 requests share a single cookie refresh", async () => {
  const c = await client();
  c.setTokens({ accessToken: "old" });
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("refresh-token")) {
      refreshes++;
      await new Promise((resolve) => setTimeout(resolve, 15));
      return response(200, { accessToken: "new" });
    }
    return options.headers.Authorization === "Bearer new"
      ? response(200, { id: 1 })
      : response(401, {});
  };
  await Promise.all([
    c.api("/admin/profile", "GET", undefined, true),
    c.api("/admin/profile", "GET", undefined, true),
  ]);
  assert.equal(refreshes, 1);
});

test("missing cookie returns anonymous, while network failure is surfaced for retry", async () => {
  const c = await client();
  globalThis.fetch = async () =>
    response(401, { errorCode: "INVALID_REFRESH_TOKEN" });
  assert.equal(await c.restoreSession(), false);
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  await assert.rejects(c.restoreSession(), (error) => error.status === 0);
});

test("refresh server errors do not discard an existing access token", async () => {
  const c = await client();
  c.setTokens({ accessToken: "old" });
  globalThis.fetch = async (url) =>
    response(url.endsWith("refresh-token") ? 500 : 401, {});
  await assert.rejects(c.api("/admin/profile", "GET", undefined, true));
  assert.equal(c.hasSession(), true);
});

test("user login and expiry are isolated from admin", async () => {
  const c = await client();
  c.setTokens({ accessToken: "admin" });
  globalThis.fetch = async (_, options) => {
    assert.equal(JSON.parse(options.body).remember, false);
    return response(200, { accessToken: "user" });
  };
  await c.userClient.login("user@example.com", "Pass@123", false);
  globalThis.fetch = async () => response(401, {});
  await assert.rejects(c.userApi("/me/profile", "GET", undefined, true));
  assert.equal(c.userClient.hasSession(), false);
  assert.equal(c.hasSession(), true);
});

test("logout sends cookie even without access token and clears memory after success", async () => {
  const c = await client();
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith("/admin/auth/logout"));
    assert.equal(options.credentials, "include");
    assert.equal(options.body, undefined);
    return response(200, true);
  };
  await c.logoutAdmin();
  c.setTokens({ accessToken: "admin" });
  await c.logoutAdmin();
  assert.equal(c.hasSession(), false);
});

test("failed logout does not pretend to clear the server cookie", async () => {
  const c = await client();
  c.setTokens({ accessToken: "a" });
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  await assert.rejects(c.logoutAdmin());
  assert.equal(c.hasSession(), true);
});

test("late response from an old login cannot overwrite or refresh the new session", async () => {
  const c = await client();
  c.setTokens({ accessToken: "old" });
  let release;
  globalThis.fetch = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const pending = c.api("/admin/profile", "GET", undefined, true);
  c.setTokens({ accessToken: "new" });
  release(response(200, { id: 1 }));
  await assert.rejects(pending, (error) => error.status === 409);
  assert.equal(c.hasSession(), true);
});

test("malformed login response is rejected", async () => {
  const c = await client();
  globalThis.fetch = async () => response(200, {});
  await assert.rejects(c.loginAdmin("admin@example.com", "Pass@123"));
  assert.equal(c.hasSession(), false);
});

test("multipart uploads preserve browser content type and send credentials", async () => {
  const c = await client();
  c.setTokens({ accessToken: "a" });
  const body = new FormData();
  body.set("avatar", new Blob(["image"]), "avatar.png");
  globalThis.fetch = async (_, options) => {
    assert.equal(options.body, body);
    assert.equal(options.headers["Content-Type"], undefined);
    assert.equal(options.credentials, "include");
    return response(200, true);
  };
  await c.api("/admin/profile/avatar", "POST", body, true);
});
