import { useLang } from '../i18n/LanguageProvider.jsx'

// Tailwind needs literal class names at build time, so the tints are listed rather than interpolated.
const TINTS = [
  'bg-emerald-100 text-emerald-700',
  'bg-green-100 text-green-700',
  'bg-teal-100 text-teal-700',
  'bg-lime-100 text-lime-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-800'
]

export default function ServicesGrid() {
  const { t } = useLang()
  const items = t('services.items')
  if (!Array.isArray(items)) return null

  return (
    <section id="services" className="py-16 sm:py-20 bg-white scroll-mt-24">
      <div className="container-page">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-agri-600 font-bold tracking-wider text-sm uppercase">{t('services.eyebrow')}</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">{t('services.title')}</h2>
          <p className="text-slate-600 text-base sm:text-lg">{t('services.subtitle')}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((item, i) => (
            <article
              key={item.title}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-xl hover:border-agri-500/50 transition duration-300 group"
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition ${TINTS[i % TINTS.length]}`}
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
