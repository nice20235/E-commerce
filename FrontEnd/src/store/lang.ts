import { create } from 'zustand'
import { translations, type Lang, type TKey } from '../i18n'

interface LangState {
  lang: Lang
  t: (key: TKey) => string
  setLang: (lang: Lang) => void
}

function _initLang(): Lang {
  try {
    return (localStorage.getItem('lang') as Lang) ?? 'uz'
  } catch {
    return 'uz'
  }
}

export const useLang = create<LangState>((set, get) => ({
  lang: _initLang(),

  t: (key: TKey) => translations[get().lang][key] ?? key,

  setLang: (lang: Lang) => {
    try { localStorage.setItem('lang', lang) } catch { /* ignore storage errors */ }
    set({ lang })
  },
}))
