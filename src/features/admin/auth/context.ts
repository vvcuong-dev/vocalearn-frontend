import { createContext, useContext } from 'react'
import type { Admin } from '../../../lib/api'
export const AuthContext = createContext<{
  admin: Admin | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  reload: () => Promise<void>
} | null>(null)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('Missing AuthProvider')
  return context
}
