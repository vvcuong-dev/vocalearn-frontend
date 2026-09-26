import { createContext, useContext } from "react";
import type { Account } from "../../../lib/api";
export const UserAuthContext = createContext<{
  user: Account | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
} | null>(null);
export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) throw new Error("Missing AuthProvider");
  return context;
}
