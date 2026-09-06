import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageProvider.jsx'
import { useSettings } from '../lib/SettingsProvider.jsx'
import { productWhatsAppUrl } from '../lib/whatsapp.js'
import { money, discountPercent, defaultVariant, priceRange } from '../lib/format.js'
import Icon from './Icon.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'

const TYPE_TINT = {
  fertilizer: 'bg-agri-100 text-agri-800',
  pesticide: 'bg-amber-100 text-amber-800',
  seed: 'bg-lime-100 text-lime-800',
  equipment: 'bg-slate-200 text-slate-700'
}

export default function ProductCard({ product }) {
  const { t, pick, lang } = useLang()
  const { settings } = useSettings()

  const variant = defaultVariant(product)
  const range = priceRange(product)
  const discount = variant ? discountPercent(variant.mrp, variant.price) : 0
  const inStock = (product.variants || []).some((v) => v.active !== false && v.stock > 0)
  const waUrl = variant ? productWhatsAppUrl({ settings, product, variant, lang, pick }) : null

  return (
    <article className="group flex flex-col bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-xl hover:border-agri-500/50 transition duration-300">
      <Link to={`/product/${product.slug}`} className="block relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={pick(product.name)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-agri-50 to-emerald-100 text-5xl">
            {product.type === 'pesticide' ? '🧪' : product.type === 'seed' ? '🌱' : product.type === 'equipment' ? '🚜' : '🌾'}
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TYPE_TINT[product.type] || TYPE_TINT.equipment}`}>
            {t(`types.${product.type}`)}
          </span>
          {discount > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
              {t('product.save', { percent: discount })}
            </span>
          )}
        </div>

        {!inStock && (
          <div className="absolute inset-0 bg-slate-900/55 flex items-center justify-center">
            <span className="text-xs font-bold text-white bg-slate-800/90 px-3 py-1.5 rounded-full">
              {t('product.outOfStock')}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {product.brand && (
          <p className="text-[11px] font-semibold text-agri-600 uppercase tracking-wide">{product.brand}</p>
        )}

        <h3 className="mt-1 font-bold text-slate-900 leading-snug line-clamp-2">
          <Link to={`/product/${product.slug}`} className="hover:text-agri-600 transition">
            {pick(product.name)}
          </Link>
        </h3>

        {product.technical && <p className="mt-1 text-xs text-slate-500">{product.technical}</p>}

        <p className="mt-2 text-sm text-slate-600 line-clamp-2 flex-1">{pick(product.shortDesc)}</p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {range?.multiple && <span className="block text-[11px] text-slate-500">{t('products.from')}</span>}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-extrabold text-slate-900">{money(range?.min ?? variant?.price)}</span>
              {discount > 0 && <span className="text-sm text-slate-400 line-through">{money(variant.mrp)}</span>}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 text-right shrink-0">
            {product.variants.length === 1 ? t('products.onePack') : t('products.packs', { count: product.variants.length })}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <WhatsAppButton href={waUrl} label={t('product.contactShort')} size="sm" className="w-full" />
          <Link
            to={`/product/${product.slug}`}
            className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-agri-600 transition"
            aria-label={pick(product.name)}
          >
            <Icon name="chevronRight" size={18} />
          </Link>
        </div>
      </div>
    </article>
  )
}
