import { create } from 'zustand'
import { translations, type Lang, type TKey } from '../i18n'

interface LangState {
  lang: Lang
  t: (key: TKey) => string
  setLang: (lang: Lang) => void
}

export const useLang = create<LangState>((set, get) => ({
  lang: (localStorage.getItem('lang') as Lang) ?? 'uz',

  t: (key: TKey) => translations[get().lang][key] ?? key,

  setLang: (lang: Lang) => {
    localStorage.setItem('lang', lang)
    set({ lang })
  },
}))
