import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../i18n/LanguageProvider.jsx'
import { api } from '../lib/api.js'
import Hero from '../components/Hero.jsx'
import ServicesGrid from '../components/ServicesGrid.jsx'
import SoilTestingSection from '../components/SoilTestingSection.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Icon from '../components/Icon.jsx'

export default function Home() {
  const { t } = useLang()
  const [featured, setFeatured] = useState([])
  const location = useLocation()

  useEffect(() => {
    const controller = new AbortController()
    api
      .listProducts({ featured: '1' }, controller.signal)
      .then(({ products }) => setFeatured(products.slice(0, 4)))
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Failed to load featured products', err)
      })
    return () => controller.abort()
  }, [])

  // Arriving at /#services from another route needs an explicit scroll.
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    // Wait a frame so the target section has rendered.
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => clearTimeout(timer)
  }, [location.hash])

  return (
    <>
      <Hero />

      {featured.length > 0 && (
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="container-page">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-3">
              <span className="text-agri-600 font-bold tracking-wider text-sm uppercase">{t('featured.eyebrow')}</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">{t('featured.title')}</h2>
              <p className="text-slate-600 text-base sm:text-lg">{t('featured.subtitle')}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-agri-500 hover:bg-agri-600 text-white font-semibold shadow-lg shadow-agri-500/25 transition hover:-translate-y-0.5"
              >
                {t('featured.viewAll')}
                <Icon name="arrowRight" size={20} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <ServicesGrid />
      <SoilTestingSection />
    </>
  )
}
