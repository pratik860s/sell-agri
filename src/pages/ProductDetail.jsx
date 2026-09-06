import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../i18n/LanguageProvider.jsx'
import { useSettings } from '../lib/SettingsProvider.jsx'
import { api } from '../lib/api.js'
import { productWhatsAppUrl } from '../lib/whatsapp.js'
import { money, discountPercent, defaultVariant, LOW_STOCK } from '../lib/format.js'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function ProductDetail() {
  const { slug } = useParams()
  const { t, pick, lang } = useLang()
  const { settings } = useSettings()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [variantId, setVariantId] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setProduct(null)
    window.scrollTo({ top: 0 })

    api
      .getProduct(slug, {}, controller.signal)
      .then(({ product: found }) => {
        setProduct(found)
        setVariantId(defaultVariant(found)?.id ?? null)
        setActiveImage(0)
        setStatus('ready')
        return api.listProducts({ category: found.category }, controller.signal).then(({ products }) => {
          setRelated(products.filter((p) => p.id !== found.id).slice(0, 4))
        })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setStatus(err.status === 404 ? 'missing' : 'error')
      })

    return () => controller.abort()
  }, [slug])

  if (status === 'loading') return <Spinner label={t('common.loading')} className="min-h-[60vh]" />

  if (status === 'missing' || status === 'error') {
    return (
      <div className="container-page py-24 text-center min-h-[60vh]">
        <p className="text-6xl">🌾</p>
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900">
          {status === 'missing' ? t('product.notFound') : t('products.error')}
        </h1>
        <p className="mt-2 text-slate-600">{status === 'missing' ? t('product.notFoundHint') : ''}</p>
        <Link to="/products" className="mt-8 btn-primary inline-flex">
          <Icon name="arrowLeft" size={19} />
          {t('product.back')}
        </Link>
      </div>
    )
  }

  const variants = product.variants || []
  const variant = variants.find((v) => v.id === variantId) || variants[0] || null
  const discount = variant ? discountPercent(variant.mrp, variant.price) : 0
  const waUrl = variant ? productWhatsAppUrl({ settings, product, variant, lang, pick }) : null

  const stockBadge = () => {
    if (!variant) return null
    if (variant.stock <= 0) {
      return { tone: 'bg-slate-100 text-slate-600 border-slate-200', text: t('product.outOfStock'), icon: 'alert' }
    }
    if (variant.stock <= LOW_STOCK) {
      return { tone: 'bg-amber-50 text-amber-800 border-amber-200', text: t('product.lowStock', { count: variant.stock }), icon: 'alert' }
    }
    return { tone: 'bg-agri-50 text-agri-800 border-agri-200', text: t('product.inStock'), icon: 'checkCircle' }
  }
  const stock = stockBadge()

  const infoBlocks = [
    { key: 'description', title: t('product.description'), value: pick(product.description) },
    { key: 'usage', title: t('product.usage'), value: pick(product.usage) },
    { key: 'safety', title: t('product.safety'), value: pick(product.safetyNotes), tone: 'amber' }
  ].filter((b) => b.value)

  const specs = [
    { label: t('product.brand'), value: product.brand },
    { label: t('product.technical'), value: product.technical },
    { label: t('product.dosage'), value: pick(product.dosage) },
    { label: t('product.sku'), value: product.sku }
  ].filter((s) => s.value)

  return (
    <div className="bg-slate-50 pb-24 lg:pb-0">
      <div className="container-page pt-6">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-agri-600 transition">
          <Icon name="arrowLeft" size={18} />
          {t('product.back')}
        </Link>
      </div>

      <div className="container-page py-6 sm:py-8 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="space-y-3 lg:sticky lg:top-28">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-slate-200">
            {product.images?.length ? (
              <img src={product.images[activeImage]} alt={pick(product.name)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-agri-50 to-emerald-100 text-8xl">
                {product.type === 'pesticide' ? '🧪' : product.type === 'seed' ? '🌱' : product.type === 'equipment' ? '🚜' : '🌾'}
              </div>
            )}
          </div>

          {product.images?.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`${pick(product.name)} ${i + 1}`}
                  className={`w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition ${
                    i === activeImage ? 'border-agri-500' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-agri-100 text-agri-800">
                {t(`types.${product.type}`)}
              </span>
              {product.brand && <span className="text-xs font-semibold text-agri-600 uppercase tracking-wide">{product.brand}</span>}
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {pick(product.name)}
            </h1>
            {product.technical && <p className="mt-1.5 text-sm text-slate-500">{product.technical}</p>}
            {pick(product.shortDesc) && <p className="mt-3 text-slate-600 leading-relaxed">{pick(product.shortDesc)}</p>}
          </div>

          {variants.length > 0 && (
            <div>
              <h2 className="label">{t('product.selectVariant')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {variants.map((v) => {
                  const selected = v.id === variant?.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      aria-pressed={selected}
                      className={`text-left px-3.5 py-3 rounded-xl border-2 transition ${
                        selected
                          ? 'border-agri-500 bg-agri-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      } ${v.stock <= 0 ? 'opacity-60' : ''}`}
                    >
                      <span className="block text-sm font-bold text-slate-900 leading-snug">{pick(v.label)}</span>
                      <span className="block mt-1 text-base font-extrabold text-agri-700">{money(v.price)}</span>
                      {v.stock <= 0 && <span className="block mt-0.5 text-[11px] text-slate-500">{t('product.outOfStock')}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{money(variant?.price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-slate-400 line-through">{money(variant.mrp)}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
                    {t('product.save', { percent: discount })}
                  </span>
                </>
              )}
            </div>

            {stock && (
              <div className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border ${stock.tone}`}>
                <Icon name={stock.icon} size={16} />
                {stock.text}
              </div>
            )}

            <WhatsAppButton
              href={waUrl}
              label={t('product.contactSeller')}
              size="lg"
              className="w-full hidden lg:inline-flex"
            />

            <p className="text-xs text-slate-500 leading-relaxed">{t('product.contactNote')}</p>
            {variant?.stock <= 0 && <p className="text-xs text-amber-700">{t('product.outOfStockNote')}</p>}
            <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">{t('product.priceNote')}</p>
          </div>

          {specs.length > 0 && (
            <dl className="card divide-y divide-slate-100">
              {specs.map((s) => (
                <div key={s.label} className="flex gap-4 px-5 py-3 text-sm">
                  <dt className="w-32 shrink-0 font-semibold text-slate-500">{s.label}</dt>
                  <dd className="text-slate-800">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.crops?.length > 0 && (
            <div>
              <h2 className="label">{t('product.crops')}</h2>
              <div className="flex flex-wrap gap-2">
                {product.crops.map((crop) => (
                  <span key={crop} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-700 capitalize">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {infoBlocks.map((block) => (
            <section
              key={block.key}
              className={`rounded-2xl p-5 border ${
                block.tone === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200/80'
              }`}
            >
              <h2 className={`font-bold mb-2 ${block.tone === 'amber' ? 'text-amber-900' : 'text-slate-900'}`}>
                {block.title}
              </h2>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${block.tone === 'amber' ? 'text-amber-900/90' : 'text-slate-600'}`}>
                {block.value}
              </p>
            </section>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <div className="container-page pb-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6">{t('product.related')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky mobile action bar — the CTA is always a thumb-tap away. */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,.06)]">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 truncate">{variant ? pick(variant.label) : ''}</p>
            <p className="text-lg font-extrabold text-slate-900 leading-tight">{money(variant?.price)}</p>
          </div>
          <WhatsAppButton href={waUrl} label={t('product.contactSeller')} className="flex-1 justify-center" />
        </div>
      </div>
    </div>
  )
}
