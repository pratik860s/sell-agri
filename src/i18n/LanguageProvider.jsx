import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import hi from './hi.json'
import en from './en.json'

const DICTS = { hi, en }
const STORAGE_KEY = 'rk_lang'

const LanguageContext = createContext(null)

/** Walk a dotted path through the dictionary. */
function lookup(dict, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), dict)
}

export function LanguageProvider({ children }) {
  // `null` means the visitor has not chosen yet — that is what triggers the gate.
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved === 'hi' || saved === 'en' ? saved : null
    } catch {
      return null
    }
  })

  const effective = lang || 'hi'

  useEffect(() => {
    document.documentElement.lang = effective
  }, [effective])

  const setLang = useCallback((next) => {
    if (next !== 'hi' && next !== 'en') return
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private browsing — the choice just won't persist */
    }
  }, [])

  /**
   * t('products.resultsMany', { count: 4 })
   * Falls back to the other language, then to the key itself, so a missing string
   * shows up as something identifiable rather than as a blank space.
   */
  const t = useCallback(
    (path, vars) => {
      let value = lookup(DICTS[effective], path)
      if (value === undefined) value = lookup(DICTS[effective === 'hi' ? 'en' : 'hi'], path)
      if (value === undefined) return path
      if (typeof value !== 'string') return value
      if (!vars) return value
      return value.replace(/\{\{(\w+)\}\}/g, (m, key) => (vars[key] !== undefined ? String(vars[key]) : m))
    },
    [effective]
  )

  /** Pick the right side of a { hi, en } pair coming from the JSON data. */
  const pick = useCallback(
    (field) => {
      if (field == null) return ''
      if (typeof field === 'string') return field
      return field[effective] || field[effective === 'hi' ? 'en' : 'hi'] || ''
    },
    [effective]
  )

  const value = useMemo(
    () => ({ lang: effective, rawLang: lang, chosen: lang !== null, setLang, t, pick }),
    [effective, lang, setLang, t, pick]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>')
  return ctx
}
