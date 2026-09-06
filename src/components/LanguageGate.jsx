import { useLang } from '../i18n/LanguageProvider.jsx'
import Icon from './Icon.jsx'

/**
 * First-visit language chooser. Shown until the visitor picks, after which the
 * choice lives in localStorage and this never renders again.
 */
export default function LanguageGate() {
  const { chosen, setLang } = useLang()
  if (chosen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-agri-dark/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 sm:p-9 text-center animate-pop-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-agri-500 to-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-agri-500/30">
          🌱
        </div>

        <h1 id="lang-gate-title" className="mt-5 text-2xl font-extrabold text-slate-900">
          Rajat Kisan <span className="text-agri-500">|</span> रजत किसान
        </h1>
        <p className="mt-2 text-sm text-slate-500">भाषा चुनें &nbsp;·&nbsp; Choose your language</p>

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={() => setLang('hi')}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-agri-500 hover:bg-agri-600 text-white font-bold text-lg shadow-lg shadow-agri-500/25 transition active:scale-[.98]"
          >
            <span>हिन्दी में देखें</span>
            <Icon name="arrowRight" size={22} />
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border-2 border-slate-200 hover:border-agri-500 hover:bg-agri-50 text-slate-800 font-bold text-lg transition active:scale-[.98]"
          >
            <span>View in English</span>
            <Icon name="arrowRight" size={22} />
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400 leading-relaxed">
          आप इसे बाद में हेडर से कभी भी बदल सकते हैं।
          <br />
          You can change this any time from the header.
        </p>
      </div>
    </div>
  )
}
