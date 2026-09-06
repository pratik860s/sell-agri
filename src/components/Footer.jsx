import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageProvider.jsx'
import { useSettings } from '../lib/SettingsProvider.jsx'
import { generalWhatsAppUrl } from '../lib/whatsapp.js'
import Icon from './Icon.jsx'
import LanguageToggle from './LanguageToggle.jsx'

export default function Footer() {
  const { t, pick, lang } = useLang()
  const { settings } = useSettings()
  const waUrl = generalWhatsAppUrl(settings, lang)

  return (
    <footer id="contact" className="bg-agri-dark text-slate-300 scroll-mt-24">
      <div className="container-page py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-agri-500 to-emerald-400 flex items-center justify-center text-xl">
              🌱
            </div>
            <span className="text-white font-bold text-lg">Rajat Kisan</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{t('footer.about')}</p>
          <LanguageToggle />
        </div>

        <div>
          <h3 className="text-white font-bold mb-4">{t('footer.quickLinks')}</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/" className="hover:text-agri-500 transition">{t('nav.home')}</Link></li>
            <li><Link to="/products" className="hover:text-agri-500 transition">{t('nav.products')}</Link></li>
            <li><a href="/#services" className="hover:text-agri-500 transition">{t('nav.services')}</a></li>
            <li><a href="/#soil-testing" className="hover:text-agri-500 transition">{t('nav.soilTesting')}</a></li>
            <li><Link to="/admin" className="hover:text-agri-500 transition">{t('footer.adminLogin')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4">{t('footer.contactUs')}</h3>
          <ul className="space-y-3 text-sm">
            {settings.phone && (
              <li className="flex items-start gap-2.5">
                <Icon name="phone" size={17} className="mt-0.5 text-agri-500" />
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-agri-500 transition">{settings.phone}</a>
              </li>
            )}
            {settings.email && (
              <li className="flex items-start gap-2.5">
                <Icon name="mail" size={17} className="mt-0.5 text-agri-500" />
                <a href={`mailto:${settings.email}`} className="hover:text-agri-500 transition break-all">{settings.email}</a>
              </li>
            )}
            {pick(settings.address) && (
              <li className="flex items-start gap-2.5">
                <Icon name="pin" size={17} className="mt-0.5 text-agri-500" />
                <span className="text-slate-400">{pick(settings.address)}</span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4">{t('footer.whatsappCta')}</h3>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1eb356] text-white font-bold px-5 py-3 rounded-xl transition active:scale-[.98]"
            >
              <Icon name="whatsapp" size={20} />
              {t('footer.whatsappCta')}
            </a>
          ) : (
            <p className="text-sm text-slate-500">—</p>
          )}
          {pick(settings.whatsappHours) && (
            <p className="mt-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{t('footer.hours')}:</span> {pick(settings.whatsappHours)}
            </p>
          )}
          {settings.youtubeUrl && (
            <a
              href={settings.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition"
            >
              <Icon name="youtube" size={20} />
              {t('nav.subscribeLong')}
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 space-y-3">
          <p className="text-xs text-amber-200/70 flex items-start gap-2">
            <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
            <span>{t('footer.disclaimer')}</span>
          </p>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Rajat Kisan. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
