import { create } from 'zustand'
import type { User } from '../types'

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
    localStorage.setItem('user', JSON.stringify(user))
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
        const user = JSON.parse(userStr) as User
        set({ user, isAuthenticated: true })
      } catch {
        localStorage.clear()
      }
    }
  },
}))
