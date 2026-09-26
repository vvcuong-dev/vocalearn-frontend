import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "../src/components/ui/FormField";
import {
  authSchema,
  fieldsSchema,
  avatarSchema,
  profileSchema,
  valuesToFormData,
  serverField,
  type FormValues,
} from "../src/lib/form-validation";
import {
  editorFields,
  resourcePayload,
} from "../src/features/admin/api/editor";
import { fieldsFor, userPayload } from "../src/features/user/editor";
import { createRoutesFromElements, matchRoutes } from "react-router-dom";
import { userRoutes } from "../src/routes/userRoutes";
import { adminRoutes } from "../src/routes/adminRoutes";

afterEach(cleanup);

function AuthForm({
  mode,
  save,
}: {
  mode: string;
  save: (values: FormValues) => void;
}) {
  const methods = useForm<FormValues>({
    resolver: zodResolver(authSchema(mode)),
    mode: mode === "login" ? "onSubmit" : "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(save)}>
        {mode === "reset-password" ? (
          <>
            <FormField
              name="newPassword"
              label="New password"
              type="password"
              fresh
            />
            <FormField
              name="confirmPassword"
              label="Confirm password"
              type="password"
              fresh
            />
          </>
        ) : (
          <>
            <FormField name="email" label="Email" type="email" />
            {mode === "login" && (
              <FormField name="password" label="Password" type="password" />
            )}
          </>
        )}
        <button>Save</button>
      </form>
    </FormProvider>
  );
}

test("login validates on submit, focuses first invalid input and submits only valid values", async () => {
  const user = userEvent.setup();
  const save = vi.fn();
  render(<AuthForm mode="login" save={save} />);
  await user.type(screen.getByLabelText("Email"), "invalid");
  await user.tab();
  expect(screen.queryByRole("alert")).toBeNull();
  await user.click(screen.getByText("Save"));
  expect(save).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(screen.getByLabelText("Email"));
  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText("Password"), "Abcd@1234");
  await user.click(screen.getByText("Save"));
  await waitFor(() => expect(save).toHaveBeenCalled());
});

test("onTouched waits for blur and clears error while correcting the input", async () => {
  const user = userEvent.setup();
  render(<AuthForm mode="forgot-password" save={vi.fn()} />);
  const email = screen.getByLabelText("Email");
  await user.type(email, "invalid");
  expect(screen.queryByRole("alert")).toBeNull();
  await user.tab();
  expect(screen.getByRole("alert").textContent).toContain("Email");
  expect(email.getAttribute("aria-invalid")).toBe("true");
  await user.clear(email);
  await user.type(email, "test@example.com");
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});

test("password confirmation updates after changing the original password", async () => {
  const user = userEvent.setup();
  render(<AuthForm mode="reset-password" save={vi.fn()} />);
  await user.type(screen.getByLabelText("New password"), "Abcd@1234");
  await user.type(screen.getByLabelText("Confirm password"), "Abcd@5678");
  await user.tab();
  expect(screen.getByRole("alert").id).toBe("confirmPassword-error");
  await user.clear(screen.getByLabelText("New password"));
  await user.type(screen.getByLabelText("New password"), "Abcd@5678");
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});

test("schemas reject blank names, weak passwords, invalid relations and out-of-range difficulty", () => {
  expect(
    authSchema("register").safeParse({
      name: "     ",
      email: "bad",
      newPassword: "weak",
      confirmPassword: "weak",
    }).success,
  ).toBe(false);
  const schema = fieldsSchema(editorFields("learning-paths", false));
  const valid = {
    name: "Travel",
    categoryId: "1",
    description: "",
    thumbnail: "",
    difficulty: "5",
    isActive: false,
  };
  expect(schema.safeParse(valid).success).toBe(true);
  expect(schema.safeParse({ ...valid, difficulty: "6" }).success).toBe(false);
  expect(schema.safeParse({ ...valid, categoryId: "" }).success).toBe(false);
  expect(schema.safeParse({ ...valid, difficulty: "1.5" }).success).toBe(false);
});

test("validated values preserve checkbox false and optional-word clearing in API payloads", () => {
  const body = resourcePayload(
    "learning-paths",
    false,
    valuesToFormData({ name: "Travel", categoryId: "2", isActive: false }),
  );
  expect(body.isActive).toBe(false);
  const values = {
    term: "hello",
    meaning: "greeting",
    phonetic: "",
    partOfSpeech: "",
    example: "",
    audioUrl: "",
    note: "",
  };
  expect(fieldsSchema(fieldsFor("words", true)).safeParse(values).success).toBe(
    true,
  );
  expect(userPayload("words", true, valuesToFormData(values))).toMatchObject({
    phonetic: null,
    example: null,
  });
});

test("profile and avatar schemas reject invalid input and accept supported images", () => {
  expect(profileSchema.safeParse({ name: " abc ", phone: "" }).success).toBe(
    false,
  );
  expect(avatarSchema.safeParse({ avatar: [] }).success).toBe(false);
  expect(
    avatarSchema.safeParse({
      avatar: [new File(["a"], "a.txt", { type: "text/plain" })],
    }).success,
  ).toBe(false);
  expect(
    avatarSchema.safeParse({
      avatar: [new File(["a"], "a.png", { type: "image/png" })],
    }).success,
  ).toBe(true);
  expect(
    avatarSchema.safeParse({
      avatar: [
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {
          type: "image/png",
        }),
      ],
    }).success,
  ).toBe(false);
});

test("server errors map only to fields available in the current form", () => {
  const error = Object.assign(new Error("Email exists"), {
    code: "EMAIL_ALREADY_EXISTS",
  });
  expect(serverField(error, ["newEmail", "password"])?.name).toBe("newEmail");
  expect(serverField(error, ["name"])).toBeUndefined();
});

test("split routes keep public, admin, user and editor URLs", () => {
  const routes = createRoutesFromElements(
    <>
      {userRoutes}
      {adminRoutes}
    </>,
  );
  for (const path of [
    "/",
    "/login",
    "/register",
    "/reset-password",
    "/admin",
    "/admin/login",
    "/admin/users/new",
    "/admin/roles/2/permissions",
    "/learn",
    "/learn/library",
    "/learn/folders/2",
    "/learn/word-sets/new",
    "/learn/words/3/edit",
    "/learn/change-email",
  ])
    expect(matchRoutes(routes, path), path).not.toBeNull();
  expect(matchRoutes(routes, "/learn/word-sets/new")?.at(-1)?.route.path).toBe(
    "word-sets/new",
  );
  expect(matchRoutes(routes, "/admin/users/new")?.at(-1)?.route.path).toBe(
    "users/new",
  );
});
