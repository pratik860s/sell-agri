import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageProvider.jsx'
import { useSettings } from '../lib/SettingsProvider.jsx'
import Icon from './Icon.jsx'

export default function Hero() {
  const { t, pick } = useLang()
  const { settings } = useSettings()
  const hero = settings.hero || {}

  const points = [t('hero.point1'), t('hero.point2'), t('hero.point3')]

  return (
    <section className="relative bg-gradient-to-b from-agri-900 via-agri-800 to-slate-900 text-white py-16 lg:py-24 overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      <div className="container-page relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {pick(hero.badge) && (
              <div className="inline-flex items-center gap-2 bg-agri-500/20 border border-agri-500/30 text-agri-100 px-4 py-1.5 rounded-full text-sm font-medium">
                <span aria-hidden="true">🌱</span>
                <span>{pick(hero.badge)}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
              {pick(hero.title)}{' '}
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-agri-500">
                {pick(hero.titleAccent)}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {pick(hero.subtitle)}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <Link
                to="/products"
                className="px-7 py-4 bg-agri-500 hover:bg-agri-600 text-white font-semibold rounded-xl shadow-lg shadow-agri-500/30 transition hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
              >
                {t('hero.ctaProducts')}
                <Icon name="arrowRight" size={20} />
              </Link>
              <a
                href="#soil-testing"
                className="px-7 py-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl transition inline-flex items-center justify-center gap-2"
              >
                {t('hero.ctaSoil')}
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-5">
              <div className="flex items-center gap-4 border-b border-slate-700/60 pb-4">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-agri-500/20 flex items-center justify-center text-2xl">
                  🌾
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg leading-tight">{t('hero.cardTitle')}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{t('hero.cardSubtitle')}</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-300">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Icon name="checkCircle" size={18} className="mt-0.5 text-agri-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="p-4 bg-agri-900/50 rounded-xl border border-agri-500/20 text-center">
                <p className="text-xs text-agri-100 font-semibold mb-1">{t('hero.respectTitle')}</p>
                <p className="text-sm font-bold text-white">{t('hero.respectBody')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
