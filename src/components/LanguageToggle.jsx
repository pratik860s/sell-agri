import { useLang } from '../i18n/LanguageProvider.jsx'

/** Two-state pill. Always shows both options so the other language is discoverable. */
export default function LanguageToggle({ variant = 'dark' }) {
  const { lang, setLang } = useLang()

  const shell =
    variant === 'dark'
      ? 'bg-white/10 border-white/15'
      : 'bg-slate-100 border-slate-200'

  const optionFor = (value) => {
    const active = lang === value
    if (active) return 'bg-agri-500 text-white shadow-sm'
    return variant === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'
  }

  return (
    <div className={`inline-flex items-center rounded-full border p-0.5 ${shell}`} role="group" aria-label="Language">
      <button
        type="button"
        onClick={() => setLang('hi')}
        aria-pressed={lang === 'hi'}
        className={`px-3 py-1 rounded-full text-xs font-bold transition ${optionFor('hi')}`}
      >
        हिं
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`px-3 py-1 rounded-full text-xs font-bold transition ${optionFor('en')}`}
      >
        EN
      </button>
    </div>
  )
}
