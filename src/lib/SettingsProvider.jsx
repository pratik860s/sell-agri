import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api.js'

const SettingsContext = createContext(null)

/** Used until /api/settings answers, so the header never renders empty. */
const FALLBACK = {
  brand: { name: 'Rajat Kisan', tagline: { hi: 'किसान की तरक्की, हमारा लक्ष्य! 🚜', en: "The farmer's progress is our goal! 🚜" } },
  whatsappNumber: '',
  whatsappHours: { hi: '', en: '' },
  youtubeUrl: '',
  phone: '',
  email: '',
  address: { hi: '', en: '' },
  hero: { badge: { hi: '', en: '' }, title: { hi: '', en: '' }, titleAccent: { hi: '', en: '' }, subtitle: { hi: '', en: '' } },
  messageTemplate: { hi: '', en: '' },
  soilMessageTemplate: { hi: '', en: '' }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (signal) => {
    try {
      const { settings: next } = await api.getSettings(signal)
      setSettings({ ...FALLBACK, ...next })
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Failed to load site settings', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return (
    <SettingsContext.Provider value={{ settings, loading, reload: () => load(), setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
