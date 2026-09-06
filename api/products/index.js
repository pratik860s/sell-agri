import { guardMethod, body, fail, json, wrap } from '../_lib/http.js'
import { readData, mutate } from '../_lib/store.js'
import { requireAdmin } from '../_lib/auth.js'
import { validateProduct } from '../_lib/validate.js'

const PUBLIC_CACHE = 's-maxage=30, stale-while-revalidate=300'

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['GET', 'POST'])) return

  if (req.method === 'GET') return list(req, res)

  if (!(await requireAdmin(req, res))) return
  return create(req, res)
})

async function list(req, res) {
  const { type, category, q, featured, all, fresh } = req.query || {}
  const isAdmin = all === '1'
  const { data } = await readData('products.json', { fresh: fresh === '1' || isAdmin })

  let items = data
  if (!isAdmin) {
    items = items
      .filter((p) => p.active)
      .map((p) => ({ ...p, variants: p.variants.filter((v) => v.active) }))
      .filter((p) => p.variants.length > 0)
  }
  if (type) items = items.filter((p) => p.type === type)
  if (category) items = items.filter((p) => p.category === category)
  if (featured === '1') items = items.filter((p) => p.featured)

  if (q) {
    const needle = String(q).toLowerCase().trim()
    items = items.filter((p) =>
      [p.name.hi, p.name.en, p.brand, p.sku, p.technical, p.shortDesc.hi, p.shortDesc.en]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    )
  }

  json(res, 200, { products: items, total: items.length }, isAdmin ? 'no-store' : PUBLIC_CACHE)
}

async function create(req, res) {
  const result = validateProduct(body(req))
  if (!result.ok) return fail(res, 400, 'Validation failed', { details: result.errors })

  const product = result.value

  const { data: current } = await readData('products.json', { fresh: true })
  if (current.some((p) => p.id === product.id)) {
    return fail(res, 409, 'A product with that id already exists')
  }

  const next = await mutate('products.json', `admin: add product "${product.name.en || product.name.hi}"`, (products) => {
    if (products.some((p) => p.slug === product.slug)) {
      product.slug = `${product.slug}-${product.id.slice(-4)}`
    }
    return [product, ...products]
  })

  json(res, 201, { product: next.find((p) => p.id === product.id) })
}
