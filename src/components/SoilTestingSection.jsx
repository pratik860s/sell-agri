import { useState } from 'react'
import { useLang } from '../i18n/LanguageProvider.jsx'
import { useSettings } from '../lib/SettingsProvider.jsx'
import { soilTestWhatsAppUrl } from '../lib/whatsapp.js'
import Icon from './Icon.jsx'

const EMPTY = { name: '', phone: '', location: '', crop: '', area: '' }

/**
 * The soil-testing enquiry from the original page. Instead of needing a mail
 * server it composes a WhatsApp message — same handoff as the product pages.
 */
export default function SoilTestingSection() {
  const { t, pick, lang } = useLang()
  const { settings } = useSettings()
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState('')

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    const digits = values.phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 12) {
      setError(t('soil.phoneError'))
      return
    }
    setError('')

    const url = soilTestWhatsAppUrl({ settings, lang, values })
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const features = [
    { icon: 'flask', tint: 'text-amber-400', title: t('soil.feature1Title'), body: t('soil.feature1Body') },
    { icon: 'leaf', tint: 'text-agri-400', title: t('soil.feature2Title'), body: t('soil.feature2Body') }
  ]

  const fields = [
    { key: 'name', label: t('soil.name'), placeholder: t('soil.namePlaceholder'), type: 'text', required: true, autoComplete: 'name' },
    { key: 'phone', label: t('soil.phone'), placeholder: t('soil.phonePlaceholder'), type: 'tel', required: true, autoComplete: 'tel', inputMode: 'numeric' },
    { key: 'location', label: t('soil.location'), placeholder: t('soil.locationPlaceholder'), type: 'text', required: true, wide: true },
    { key: 'crop', label: t('soil.crop'), placeholder: t('soil.cropPlaceholder'), type: 'text' },
    { key: 'area', label: t('soil.area'), placeholder: t('soil.areaPlaceholder'), type: 'text' }
  ]

  return (
    <section
      id="soil-testing"
      className="py-16 sm:py-20 bg-gradient-to-br from-amber-900 via-slate-900 to-agri-900 text-white relative overflow-hidden scroll-mt-24"
    >
      <div className="container-page relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-1.5 rounded-full text-sm font-semibold">
              {t('soil.badge')}
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {t('soil.title')} <br />
              <span className="text-amber-400">{t('soil.titleAccent')}</span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">{t('soil.body')}</p>

            <div className="space-y-4 pt-1">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3.5 bg-white/5 p-4 rounded-xl border border-white/10">
                  <Icon name={f.icon} size={26} className={`${f.tint} mt-0.5`} />
                  <div>
                    <h3 className="font-bold text-white">{f.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white text-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{t('soil.formTitle')}</h3>
              <p className="text-sm text-slate-500 mt-1.5">{t('soil.formSubtitle')}</p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {fields.map((f) => (
                    <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
                      <label htmlFor={`soil-${f.key}`} className="label">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        id={`soil-${f.key}`}
                        type={f.type}
                        required={f.required}
                        value={values[f.key]}
                        onChange={set(f.key)}
                        placeholder={f.placeholder}
                        autoComplete={f.autoComplete}
                        inputMode={f.inputMode}
                        className="field"
                      />
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <Icon name="alert" size={16} /> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!settings.whatsappNumber}
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1eb356] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-6 py-4 rounded-xl shadow-lg shadow-[#25D366]/25 transition active:scale-[.98]"
                >
                  <Icon name="whatsapp" size={22} />
                  {t('soil.submit')}
                </button>

                {pick(settings.whatsappHours) && (
                  <p className="text-xs text-center text-slate-500">{pick(settings.whatsappHours)}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
