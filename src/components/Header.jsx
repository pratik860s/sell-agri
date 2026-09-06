import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../i18n/LanguageProvider.jsx'
import { useSettings } from '../lib/SettingsProvider.jsx'
import Icon from './Icon.jsx'
import LanguageToggle from './LanguageToggle.jsx'

export default function Header() {
  const { t, pick } = useLang()
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Close the drawer whenever the route changes, otherwise it stays open behind the new page.
  useEffect(() => setOpen(false), [location.pathname, location.hash])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const links = [
    { to: '/products', label: t('nav.products') },
    { hash: 'services', label: t('nav.services') },
    { hash: 'soil-testing', label: t('nav.soilTesting') },
    { hash: 'contact', label: t('nav.contact') }
  ]

  /** Hash links must first return to the home page when we are on another route. */
  const goToHash = (hash) => (event) => {
    event.preventDefault()
    setOpen(false)
    if (location.pathname === '/') {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate(`/#${hash}`)
    }
  }

  const renderLink = (link, className) =>
    link.to ? (
      <Link key={link.label} to={link.to} className={className}>
        {link.label}
      </Link>
    ) : (
      <a key={link.label} href={`/#${link.hash}`} onClick={goToHash(link.hash)} className={className}>
        {link.label}
      </a>
    )

  return (
    <header className="sticky top-0 z-50 bg-agri-900/95 backdrop-blur-md text-white border-b border-agri-800 shadow-md">
      <div className="container-page h-[72px] sm:h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gradient-to-tr from-agri-500 to-emerald-400 flex items-center justify-center text-2xl shadow-lg group-hover:scale-105 transition">
            🌱
          </div>
          <div className="min-w-0">
            <span className="text-base sm:text-xl font-bold tracking-tight block truncate">
              Rajat Kisan <span className="text-agri-500">|</span> रजत किसान
            </span>
            <span className="hidden sm:block text-xs text-agri-100/80 -mt-0.5 font-medium truncate">
              {pick(settings.brand?.tagline)}
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold">
          {links.map((l) => renderLink(l, 'hover:text-agri-500 transition whitespace-nowrap'))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />

          {settings.youtubeUrl && (
            <a
              href={settings.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-full shadow-md transition active:scale-95"
            >
              <Icon name="youtube" size={20} />
              <span className="hidden md:inline">{t('nav.subscribe')}</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t('nav.menu')}
            className="lg:hidden p-2 -mr-2 rounded-lg text-slate-200 hover:bg-agri-800 transition"
          >
            <Icon name={open ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="lg:hidden bg-agri-900 border-t border-agri-800 px-4 pt-3 pb-6 space-y-1 animate-fade-in">
          <Link to="/" className="block py-3 text-base font-medium text-slate-200 hover:text-agri-500">
            {t('nav.home')}
          </Link>
          {links.map((l) =>
            renderLink(l, 'block py-3 text-base font-medium text-slate-200 hover:text-agri-500')
          )}
          {settings.youtubeUrl && (
            <a
              href={settings.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium flex justify-center items-center gap-2 transition"
            >
              <Icon name="youtube" size={20} />
              <span>{t('nav.subscribeLong')}</span>
            </a>
          )}
        </div>
      )}
    </header>
  )
}
