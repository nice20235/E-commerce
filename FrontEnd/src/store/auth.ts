import { create } from 'zustand'
import type { User } from '../types'

// Only store non-sensitive display fields in localStorage.
// is_admin is intentionally excluded: the backend enforces authorization
// via JWT, so the frontend's is_admin value is only used to show/hide UI
// elements. Persisting it to localStorage means a simple XSS could elevate
// apparent role in the UI. Instead, is_admin is kept only in session memory
// and re-confirmed via /users/me on every page load.
type StoredUser = Omit<User, 'is_admin'>

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isVerifying: boolean
  setAuth: (user: User) => void
  clearAuth: () => void
  initFromStorage: () => void
  setVerifying: (v: boolean) => void
}

function loadFromStorage(): { user: User | null; isAuthenticated: boolean; isVerifying: boolean } {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const stored = JSON.parse(userStr) as StoredUser
      // is_admin defaults to false; the real value is fetched from /users/me
      // on every load before any admin-gated UI is shown.
      return { user: { ...stored, is_admin: false } as User, isAuthenticated: true, isVerifying: true }
    }
  } catch {
    localStorage.removeItem('user')
  }
  return { user: null, isAuthenticated: false, isVerifying: false }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorage(),

  setAuth: (user) => {
    const { is_admin, ...displayFields } = user
    localStorage.setItem('user', JSON.stringify(displayFields))
    set({ user, isAuthenticated: true, isVerifying: false })
  },

  clearAuth: () => {
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false, isVerifying: false })
  },

  // No-op: initialization now happens synchronously at store creation time.
  initFromStorage: () => {},

  setVerifying: (isVerifying) => set({ isVerifying }),
}))
