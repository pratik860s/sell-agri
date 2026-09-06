/** Input validation + normalisation for products. Rejects bad data before it reaches a commit. */

export const PRODUCT_TYPES = ['fertilizer', 'pesticide', 'seed', 'equipment']

const str = (v) => (typeof v === 'string' ? v.trim() : '')

/** Coerce anything into a { hi, en } pair, falling back across languages. */
export function i18nField(value) {
  if (value && typeof value === 'object') {
    const hi = str(value.hi)
    const en = str(value.en)
    return { hi: hi || en, en: en || hi }
  }
  const single = str(value)
  return { hi: single, en: single }
}

export function slugify(input) {
  const base = str(input)
  // Devanagari has no useful ASCII slug, so keep Unicode letters and hyphenate.
  const slug = base
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `item-${Date.now().toString(36)}`
}

export function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function normaliseVariant(raw = {}) {
  const label = i18nField(raw.label)
  return {
    id: str(raw.id) || id('v'),
    label,
    mrp: num(raw.mrp, 0),
    price: num(raw.price, 0),
    stock: Math.floor(num(raw.stock, 0)),
    unit: str(raw.unit) || 'unit',
    active: raw.active !== false
  }
}

/**
 * @returns {{ ok: true, value: object } | { ok: false, errors: string[] }}
 */
export function validateProduct(raw = {}, { existing = null } = {}) {
  const errors = []

  const name = i18nField(raw.name)
  if (!name.hi && !name.en) errors.push('Product name is required in at least one language.')

  const type = str(raw.type)
  if (!PRODUCT_TYPES.includes(type)) {
    errors.push(`type must be one of: ${PRODUCT_TYPES.join(', ')}`)
  }

  const variantsInput = Array.isArray(raw.variants) ? raw.variants : []
  if (variantsInput.length === 0) errors.push('At least one variant (pack size) is required.')

  const variants = variantsInput.map(normaliseVariant)
  variants.forEach((v, i) => {
    if (!v.label.hi && !v.label.en) errors.push(`Variant ${i + 1}: label is required.`)
    if (v.price <= 0) errors.push(`Variant ${i + 1}: price must be greater than 0.`)
    if (v.mrp && v.mrp < v.price) errors.push(`Variant ${i + 1}: MRP cannot be lower than the selling price.`)
  })

  const seen = new Set()
  for (const v of variants) {
    if (seen.has(v.id)) errors.push(`Duplicate variant id "${v.id}".`)
    seen.add(v.id)
  }

  if (errors.length) return { ok: false, errors }

  const now = new Date().toISOString()
  const value = {
    id: existing?.id || str(raw.id) || id('p'),
    slug: slugify(raw.slug || name.en || name.hi),
    sku: str(raw.sku),
    type,
    category: str(raw.category),
    brand: str(raw.brand),
    name,
    shortDesc: i18nField(raw.shortDesc),
    description: i18nField(raw.description),
    usage: i18nField(raw.usage),
    dosage: i18nField(raw.dosage),
    safetyNotes: i18nField(raw.safetyNotes),
    technical: str(raw.technical),
    crops: Array.isArray(raw.crops) ? raw.crops.map(str).filter(Boolean) : [],
    images: Array.isArray(raw.images) ? raw.images.map(str).filter(Boolean) : [],
    variants,
    featured: Boolean(raw.featured),
    active: raw.active !== false,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }

  return { ok: true, value }
}
