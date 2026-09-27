import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, act } from "@testing-library/react";
import { lazy, StrictMode, Suspense } from "react";
import { UserAuthProvider } from "../src/features/user/auth/UserAuthProvider";

vi.hoisted(() => {
  vi.stubEnv("VITE_API_URL", "http://localhost:3000/api");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("loading a lazy login page only checks the anonymous session once", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ success: false, errorCode: "INVALID_REFRESH_TOKEN" }),
    { status: 401 },
  ));
  vi.stubGlobal("fetch", fetch);
  let finish!: (module: { default: () => React.JSX.Element }) => void;
  const Login = lazy(() => new Promise<{ default: () => React.JSX.Element }>((resolve) => {
    finish = resolve;
  }));
  render(
    <StrictMode>
      <Suspense fallback={<p>Outer loading</p>}>
        <UserAuthProvider><Login /></UserAuthProvider>
      </Suspense>
    </StrictMode>,
  );
  // Wait until the lazy child starts loading, after the first session check.
  await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
  await act(async () => finish({ default: () => <h1>Login ready</h1> }));
  await screen.findByText("Login ready");
  expect(fetch).toHaveBeenCalledTimes(1);
});
