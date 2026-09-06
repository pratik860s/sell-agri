/** Indian-format currency. 266.5 -> "₹266.50", 1350 -> "₹1,350" */
export function money(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(n)
}

export function discountPercent(mrp, price) {
  const m = Number(mrp)
  const p = Number(price)
  if (!Number.isFinite(m) || !Number.isFinite(p) || m <= 0 || p >= m) return 0
  return Math.round(((m - p) / m) * 100)
}

/** The variant a product should show by default: cheapest one that is actually in stock. */
export function defaultVariant(product) {
  const variants = product?.variants || []
  if (variants.length === 0) return null
  const inStock = variants.filter((v) => v.active !== false && v.stock > 0)
  const pool = inStock.length ? inStock : variants
  return pool.reduce((cheapest, v) => (v.price < cheapest.price ? v : cheapest), pool[0])
}

export function priceRange(product) {
  const active = (product?.variants || []).filter((v) => v.active !== false)
  if (!active.length) return null
  const prices = active.map((v) => v.price)
  return { min: Math.min(...prices), max: Math.max(...prices), multiple: active.length > 1 }
}

export const LOW_STOCK = 10
