import { guardMethod, body, fail, json, wrap } from '../_lib/http.js'
import { readData, mutate } from '../_lib/store.js'
import { requireAdmin } from '../_lib/auth.js'
import { validateProduct } from '../_lib/validate.js'

const PUBLIC_CACHE = 's-maxage=30, stale-while-revalidate=300'

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['GET', 'PUT', 'DELETE'])) return

  const key = req.query?.id
  if (!key) return fail(res, 400, 'Missing product id')

  if (req.method === 'GET') return read(req, res, key)

  if (!(await requireAdmin(req, res))) return
  return req.method === 'PUT' ? update(req, res, key) : remove(req, res, key)
})

async function read(req, res, key) {
  const isAdmin = req.query?.all === '1'
  const { data } = await readData('products.json', { fresh: isAdmin })
  const product = data.find((p) => p.id === key || p.slug === key)

  if (!product) return fail(res, 404, 'Product not found')
  if (!isAdmin && !product.active) return fail(res, 404, 'Product not found')

  const payload = isAdmin ? product : { ...product, variants: product.variants.filter((v) => v.active) }
  json(res, 200, { product: payload }, isAdmin ? 'no-store' : PUBLIC_CACHE)
}

async function update(req, res, key) {
  const { data } = await readData('products.json', { fresh: true })
  const existing = data.find((p) => p.id === key || p.slug === key)
  if (!existing) return fail(res, 404, 'Product not found')

  const result = validateProduct(body(req), { existing })
  if (!result.ok) return fail(res, 400, 'Validation failed', { details: result.errors })

  const product = result.value
  const next = await mutate('products.json', `admin: update product "${product.name.en || product.name.hi}"`, (products) => {
    if (products.some((p) => p.slug === product.slug && p.id !== product.id)) {
      product.slug = `${product.slug}-${product.id.slice(-4)}`
    }
    return products.map((p) => (p.id === existing.id ? product : p))
  })

  json(res, 200, { product: next.find((p) => p.id === existing.id) })
}

async function remove(req, res, key) {
  const { data } = await readData('products.json', { fresh: true })
  const existing = data.find((p) => p.id === key || p.slug === key)
  if (!existing) return fail(res, 404, 'Product not found')

  await mutate('products.json', `admin: delete product "${existing.name.en || existing.name.hi}"`, (products) =>
    products.filter((p) => p.id !== existing.id)
  )

  json(res, 200, { ok: true, id: existing.id })
}
