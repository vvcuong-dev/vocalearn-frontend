import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkWordDialog } from "../src/features/user/components/BulkWordDialog";
import { ThemeToggle } from "../src/components/ui/ThemeToggle";
import { userApi } from "../src/lib/api";

vi.mock("../src/lib/api", () => ({ userApi: vi.fn() }));
const api = vi.mocked(userApi);
const audioUrl =
  "https://commons.wikimedia.org/wiki/Special:FilePath/En-us-run.ogg";
beforeEach(() => {
  api.mockReset();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  api.mockImplementation(async (path) => {
    if (path.startsWith("/dictionary/lookup"))
      return {
        id: 9,
        term: "run",
        phonetic: "/rʌn/",
        meaning: "Chạy.",
        partOfSpeech: "V",
        example: "I run every day.",
        audioUrl,
      };
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

test("selecting a phonetic suggestion saves audio without showing a player in the dialog", async () => {
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
  await user.click(await screen.findByRole("option", { name: "run" }));
  expect(
    (screen.getByLabelText("Nghĩa dòng 1") as HTMLInputElement).value,
  ).toBe("");
  expect(
    (screen.getByLabelText("Phiên âm dòng 1") as HTMLInputElement).value,
  ).toBe("");
  await user.click(screen.getByLabelText("Phiên âm dòng 1"));
  await user.click(await screen.findByRole("option", { name: "/rʌn/" }));
  await user.click(screen.getByLabelText("Nghĩa dòng 1"));
  await user.click(await screen.findByRole("option", { name: "Chạy." }));
  expect(
    (screen.getByLabelText("Nghĩa dòng 1") as HTMLInputElement).value,
  ).toBe("Chạy.");
  await user.click(screen.getByLabelText("Ví dụ dòng 1"));
  await user.click(
    await screen.findByRole("option", { name: "I run every day." }),
  );
  expect(
    (screen.getByLabelText("Ví dụ dòng 1") as HTMLInputElement).value,
  ).toBe("I run every day.");
  await user.selectOptions(screen.getByLabelText("Loại từ dòng 1"), "V");
  expect(document.querySelector("dialog audio")).toBeNull();
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
          audioUrl,
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

test("choosing a term preserves manually entered fields; exact lookup does not use prefix suggestions", async () => {
  const user = userEvent.setup();
  render(
    <BulkWordDialog
      wordSetId={1}
      name="Test"
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  await user.type(screen.getByLabelText("Nghĩa dòng 1"), "Nghĩa tự nhập");
  await user.type(screen.getByLabelText("Từ vựng dòng 1"), "ru");
  await screen.findByRole("option", { name: "run" });
  await user.keyboard("{ArrowDown}{Enter}");
  expect(
    (screen.getByLabelText("Từ vựng dòng 1") as HTMLInputElement).value,
  ).toBe("run");
  expect(
    (screen.getByLabelText("Nghĩa dòng 1") as HTMLInputElement).value,
  ).toBe("Nghĩa tự nhập");
  await user.click(screen.getByLabelText("Phiên âm dòng 1"));
  await screen.findByRole("option", { name: "/rʌn/" });
  expect(api).toHaveBeenCalledWith(
    "/dictionary/lookup?q=run",
    "GET",
    undefined,
    true,
  );
});

test.each([null, undefined])(
  "a phonetic without audio (%s) can still be saved",
  async (audioUrl) => {
    const user = userEvent.setup();
    const saved = vi.fn();
    api.mockImplementation(async (path) => {
      if (path.startsWith("/dictionary/lookup"))
        return { id: 9, term: "run", phonetic: "/rʌn/", audioUrl };
      if (path === "/me/word-sets") return [];
      if (path === "/words") return [];
      return [];
    });
    render(
      <BulkWordDialog
        wordSetId={1}
        name="Test"
        onClose={vi.fn()}
        onSaved={saved}
      />,
    );
    await user.type(screen.getByLabelText("Từ vựng dòng 1"), "run");
    await user.click(screen.getByLabelText("Phiên âm dòng 1"));
    await user.click(await screen.findByRole("option", { name: "/rʌn/" }));
    expect(
      (screen.getByLabelText("Phiên âm dòng 1") as HTMLInputElement).value,
    ).toBe("/rʌn/");
    expect(screen.queryByLabelText("Nghe phát âm dòng 1")).toBeNull();
    await user.type(screen.getByLabelText("Nghĩa dòng 1"), "Chạy");
    await user.click(screen.getByRole("button", { name: "Lưu 1 từ" }));
    await waitFor(() => expect(saved).toHaveBeenCalledWith(1));
    expect(api).toHaveBeenCalledWith(
      "/words",
      "POST",
      {
        wordSetId: 1,
        words: [expect.objectContaining({ phonetic: "/rʌn/", audioUrl: null })],
      },
      true,
    );
  },
);

test("manual entry does not show an add-audio button", async () => {
  const user = userEvent.setup();
  render(
    <BulkWordDialog
      wordSetId={1}
      name="Test"
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );
  await user.type(screen.getByLabelText("Từ vựng dòng 1"), "unknown");
  api.mockResolvedValue(null);
  expect(screen.queryByLabelText("Lấy âm thanh dòng 1")).toBeNull();
  expect(screen.queryByLabelText("Nghe phát âm dòng 1")).toBeNull();
  await user.type(screen.getByLabelText("Nghĩa dòng 1"), "Tự nhập");
  expect(
    (screen.getByLabelText("Nghĩa dòng 1") as HTMLInputElement).value,
  ).toBe("Tự nhập");
});
