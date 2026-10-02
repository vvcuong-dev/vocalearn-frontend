import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkWordDialog } from "../src/features/user/components/BulkWordDialog";
import { ThemeToggle } from "../src/components/ui/ThemeToggle";
import { userApi } from "../src/lib/api";

vi.mock("../src/lib/api", () => ({ userApi: vi.fn() }));
const api = vi.mocked(userApi);
beforeEach(() => {
  api.mockReset();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  api.mockImplementation(async (path) => {
    if (path === "/me/word-sets")
      return [
        { id: 1, name: "Bộ từ của tôi" },
        { id: 2, name: "Du lịch" },
      ];
    if (path.startsWith("/dictionary/suggest"))
      return [
        {
          id: 9,
          term: "run",
          phonetic: "/rʌn/",
          meaning: "Chạy.",
          partOfSpeech: "V",
          example: "I run every day.",
        },
      ];
    return [];
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

test("dictionary choice fills fields; saves the selected set and omits empty rows", async () => {
  const user = userEvent.setup();
  const saved = vi.fn();
  render(
    <BulkWordDialog
      wordSetId={1}
      name="Bộ từ của tôi"
      onClose={vi.fn()}
      onSaved={saved}
    />,
  );
  await user.type(screen.getByLabelText("Từ vựng dòng 1"), "ru");
  await user.click(await screen.findByRole("button", { name: /run.*Chạy/ }));
  expect(
    (screen.getByLabelText("Nghĩa dòng 1") as HTMLInputElement).value,
  ).toBe("Chạy.");
  expect(
    (screen.getByLabelText("Ví dụ dòng 1") as HTMLInputElement).value,
  ).toBe("I run every day.");
  await user.selectOptions(screen.getByLabelText("Thêm vào bộ từ:"), "2");
  await user.click(screen.getByRole("button", { name: "Lưu 1 từ" }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(2));
  expect(api).toHaveBeenCalledWith(
    "/words",
    "POST",
    {
      wordSetId: 2,
      words: [
        {
          term: "run",
          meaning: "Chạy.",
          phonetic: "/rʌn/",
          partOfSpeech: "V",
          example: "I run every day.",
          note: null,
        },
      ],
    },
    true,
  );
});

test("incomplete rows block saving; failed saves preserve drafts and can retry", async () => {
  const user = userEvent.setup();
  const saved = vi.fn();
  render(
    <BulkWordDialog
      wordSetId={1}
      name="Bộ từ của tôi"
      onClose={vi.fn()}
      onSaved={saved}
    />,
  );
  await user.type(screen.getByLabelText("Nghĩa dòng 1"), "Xin chào");
  await user.click(screen.getByRole("button", { name: "Lưu 1 từ" }));
  expect(screen.getByRole("alert").textContent).toContain("Dòng 1");
  expect(api.mock.calls.some(([path]) => path === "/words")).toBe(false);
  await user.type(screen.getByLabelText("Từ vựng dòng 1"), "hello");
  api.mockImplementation(async (path) => {
    if (path === "/words") throw new Error("Mất kết nối");
    return [];
  });
  await user.click(screen.getByRole("button", { name: "Lưu 1 từ" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Mất kết nối");
  expect(
    (screen.getByLabelText("Từ vựng dòng 1") as HTMLInputElement).value,
  ).toBe("hello");
  api.mockResolvedValue([]);
  await user.click(screen.getByRole("button", { name: "Lưu 1 từ" }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(1));
});

test("row removal preserves the other row values and create-set preserves drafts", async () => {
  const user = userEvent.setup();
  render(
    <BulkWordDialog
      wordSetId={1}
      name="Bộ từ của tôi"
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  expect(screen.queryByLabelText("Từ vựng dòng 2")).toBeNull();
  await user.click(screen.getByRole("button", { name: /Thêm dòng/ }));
  await user.type(screen.getByLabelText("Nghĩa dòng 2"), "Giữ lại");
  await user.click(screen.getByLabelText("Xóa dòng 1"));
  expect(
    (screen.getByLabelText("Nghĩa dòng 1") as HTMLInputElement).value,
  ).toBe("Giữ lại");
  await user.click(screen.getByRole("button", { name: /Thêm dòng/ }));
  expect(screen.getByLabelText("Từ vựng dòng 2")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "+ Tạo mới" }));
  await user.type(screen.getByLabelText("Tên bộ từ mới"), "Công việc");
  api.mockResolvedValueOnce({ id: 3, name: "Công việc" });
  await user.click(screen.getByRole("button", { name: "Tạo bộ từ" }));
  await waitFor(() =>
    expect(
      (screen.getByLabelText("Thêm vào bộ từ:") as HTMLSelectElement).value,
    ).toBe("3"),
  );
  expect(
    (screen.getByLabelText("Nghĩa dòng 1") as HTMLInputElement).value,
  ).toBe("Giữ lại");
});

test("theme toggles and remembers the choice across remounts", async () => {
  const user = userEvent.setup();
  const view = render(<ThemeToggle />);
  await user.click(
    screen.getByRole("button", { name: "Chuyển sang giao diện tối" }),
  );
  expect(localStorage.getItem("vocalearn-theme")).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  view.unmount();
  render(<ThemeToggle />);
  await user.click(
    screen.getByRole("button", { name: "Chuyển sang giao diện sáng" }),
  );
  expect(document.documentElement.dataset.theme).toBe("light");
});
