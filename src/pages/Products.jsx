import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLang } from '../i18n/LanguageProvider.jsx'
import { api } from '../lib/api.js'
import ProductCard from '../components/ProductCard.jsx'
import Spinner from '../components/Spinner.jsx'
import Icon from '../components/Icon.jsx'

const TYPES = ['fertilizer', 'pesticide', 'seed', 'equipment']

export default function Products() {
  const { t, pick } = useLang()
  const [params, setParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')

  const type = params.get('type') || ''
  const category = params.get('category') || ''
  const query = params.get('q') || ''

  // Local mirror so typing stays responsive; the URL is updated on a debounce.
  const [searchInput, setSearchInput] = useState(query)
  useEffect(() => setSearchInput(query), [query])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput === query) return
      const next = new URLSearchParams(params)
      if (searchInput) next.set('q', searchInput)
      else next.delete('q')
      setParams(next, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, query, params, setParams])

  useEffect(() => {
    const controller = new AbortController()
    api
      .getCategories(controller.signal)
      .then(({ categories: list }) => setCategories(list))
      .catch(() => setCategories([]))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    api
      .listProducts({ type, category, q: query }, controller.signal)
      .then(({ products: list }) => {
        setProducts(list)
        setStatus('ready')
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus('error')
      })
    return () => controller.abort()
  }, [type, category, query])

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    // A category belongs to one type, so changing the type invalidates it.
    if (key === 'type') next.delete('category')
    setParams(next)
  }

  const visibleCategories = useMemo(
    () => (type ? categories.filter((c) => c.type === type) : categories),
    [categories, type]
  )

  const hasFilters = Boolean(type || category || query)

  return (
    <div className="bg-slate-50 min-h-[70vh]">
      <div className="bg-agri-900 text-white py-12 sm:py-16">
        <div className="container-page">
          <h1 className="text-3xl sm:text-4xl font-extrabold">{t('products.title')}</h1>
          <p className="mt-2 text-slate-300 max-w-2xl">{t('products.subtitle')}</p>
        </div>
      </div>

      <div className="container-page py-8 sm:py-10">
        <div className="card p-4 sm:p-5 mb-8 space-y-4">
          <div className="relative">
            <Icon name="search" size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('products.search')}
              aria-label={t('products.searchAria')}
              className="field pl-11"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-type" className="label">{t('products.allTypes')}</label>
              <select id="filter-type" value={type} onChange={(e) => update('type', e.target.value)} className="field">
                <option value="">{t('products.allTypes')}</option>
                {TYPES.map((value) => (
                  <option key={value} value={value}>{t(`types.${value}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-category" className="label">{t('products.allCategories')}</label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => update('category', e.target.value)}
                className="field"
              >
                <option value="">{t('products.allCategories')}</option>
                {visibleCategories.map((c) => (
                  <option key={c.id} value={c.id}>{pick(c.name)}</option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams())}
              className="inline-flex items-center gap-2 text-sm font-semibold text-agri-600 hover:text-agri-700"
            >
              <Icon name="close" size={16} />
              {t('products.clearFilters')}
            </button>
          )}
        </div>

        {status === 'loading' && <Spinner label={t('products.loading')} />}

        {status === 'error' && (
          <div className="text-center py-16">
            <Icon name="alert" size={40} className="mx-auto text-amber-500" />
            <p className="mt-4 text-slate-700 font-semibold">{t('products.error')}</p>
            <button type="button" onClick={() => window.location.reload()} className="btn-ghost mt-5">
              <Icon name="refresh" size={17} />
              {t('products.retry')}
            </button>
          </div>
        )}

        {status === 'ready' && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl">🔍</p>
            <p className="mt-4 text-slate-700 font-semibold">{t('products.empty')}</p>
            <p className="mt-1 text-sm text-slate-500">{t('products.emptyHint')}</p>
            {hasFilters && (
              <button type="button" onClick={() => setParams(new URLSearchParams())} className="btn-ghost mt-5">
                {t('products.clearFilters')}
              </button>
            )}
          </div>
        )}

        {status === 'ready' && products.length > 0 && (
          <>
            <p className="mb-5 text-sm text-slate-500">
              {products.length === 1 ? t('products.resultsOne') : t('products.resultsMany', { count: products.length })}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
