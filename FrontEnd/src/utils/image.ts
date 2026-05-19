const API_BASE = (import.meta.env.VITE_API_URL ?? '/').replace(/\/$/, '')

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}
