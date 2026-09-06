import { createContext, useCallback, useContext, useState } from 'react'
import Icon from '../Icon.jsx'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === 'error' ? 7000 : 4000)
  }, [])

  const value = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info')
  }

  const tones = {
    success: 'bg-agri-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 text-white'
  }
  const icons = { success: 'checkCircle', error: 'alert', info: 'info' }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] space-y-2 max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-pop-in ${tones[t.tone]}`}
          >
            <Icon name={icons[t.tone]} size={18} className="mt-0.5" />
            <span className="whitespace-pre-line">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
