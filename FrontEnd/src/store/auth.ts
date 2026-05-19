import { create } from 'zustand'
import type { User } from '../types'

// Only store non-sensitive display fields in localStorage.
// is_admin is intentionally excluded: the backend enforces authorization
// via JWT, so the frontend's is_admin value is only used to show/hide UI
// elements. Persisting it to localStorage means a simple XSS could elevate
// apparent role in the UI. Instead, is_admin is kept only in session memory.
type StoredUser = Omit<User, 'is_admin'>

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setAuth: (user: User) => void
  clearAuth: () => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setAuth: (user) => {
    const { is_admin, ...displayFields } = user
    // Store only display fields; is_admin is NOT persisted.
    localStorage.setItem('user', JSON.stringify(displayFields))
    set({ user, isAuthenticated: true })
  },

  clearAuth: () => {
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false })
  },

  initFromStorage: () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const stored = JSON.parse(userStr) as StoredUser
        // Restore display fields only; is_admin defaults to false until the
        // server confirms the real role (e.g. via /users/me on next load).
        const user: User = { ...stored, is_admin: false }
        set({ user, isAuthenticated: true })
      } catch {
        // Only remove the corrupted auth entry, not all browser storage.
        localStorage.removeItem('user')
      }
    }
  },
}))
