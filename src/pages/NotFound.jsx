import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageProvider.jsx'
import Icon from '../components/Icon.jsx'

export default function NotFound() {
  const { t } = useLang()
  return (
    <div className="container-page py-24 text-center">
      <p className="text-7xl">🌾</p>
      <h1 className="mt-6 text-3xl font-extrabold text-slate-900">{t('notFound.title')}</h1>
      <p className="mt-2 text-slate-600">{t('notFound.body')}</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-agri-500 hover:bg-agri-600 text-white font-semibold transition"
      >
        <Icon name="arrowLeft" size={20} />
        {t('notFound.home')}
      </Link>
    </div>
  )
}
