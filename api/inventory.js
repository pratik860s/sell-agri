/**
 * Bulk price / stock editing. Deliberately one route rather than N product PUTs:
 * editing thirty prices should produce one commit, not thirty.
 */
import { guardMethod, body, fail, json, wrap } from './_lib/http.js'
import { readData, mutate } from './_lib/store.js'
import { requireAdmin } from './_lib/auth.js'

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['GET', 'PATCH'])) return
  if (!(await requireAdmin(req, res))) return

  if (req.method === 'GET') return snapshot(res)
  return apply(req, res)
})

async function snapshot(res) {
  const { data } = await readData('products.json', { fresh: true })
  const rows = data.flatMap((p) =>
    p.variants.map((v) => ({
      productId: p.id,
      productName: p.name,
      slug: p.slug,
      sku: p.sku,
      type: p.type,
      productActive: p.active,
      variantId: v.id,
      label: v.label,
      unit: v.unit,
      mrp: v.mrp,
      price: v.price,
      stock: v.stock,
      active: v.active
    }))
  )
  json(res, 200, { rows, total: rows.length })
}

async function apply(req, res) {
  const { updates } = body(req)
  if (!Array.isArray(updates) || updates.length === 0) {
    return fail(res, 400, 'Provide a non-empty "updates" array')
  }
  if (updates.length > 500) return fail(res, 400, 'Too many updates in one request (max 500)')

  const errors = []
  let applied = 0

  const next = await mutate('products.json', `admin: inventory update (${updates.length} change${updates.length === 1 ? '' : 's'})`, (products) => {
    for (const u of updates) {
      const product = products.find((p) => p.id === u.productId)
      if (!product) {
        errors.push(`Unknown product "${u.productId}"`)
        continue
      }
      const variant = product.variants.find((v) => v.id === u.variantId)
      if (!variant) {
        errors.push(`Unknown variant "${u.variantId}" on ${product.slug}`)
        continue
      }

      if (u.price !== undefined) {
        const price = Number(u.price)
        if (!Number.isFinite(price) || price <= 0) {
          errors.push(`${product.slug} / ${u.variantId}: price must be greater than 0`)
          continue
        }
        variant.price = price
      }
      if (u.mrp !== undefined) {
        const mrp = Number(u.mrp)
        if (!Number.isFinite(mrp) || mrp < 0) {
          errors.push(`${product.slug} / ${u.variantId}: MRP is not a valid number`)
          continue
        }
        variant.mrp = mrp
      }
      if (u.stock !== undefined) {
        const stock = Math.floor(Number(u.stock))
        if (!Number.isFinite(stock) || stock < 0) {
          errors.push(`${product.slug} / ${u.variantId}: stock must be 0 or more`)
          continue
        }
        variant.stock = stock
      }
      if (u.active !== undefined) variant.active = Boolean(u.active)

      if (variant.mrp && variant.mrp < variant.price) {
        errors.push(`${product.slug} / ${u.variantId}: MRP is lower than the selling price`)
        continue
      }

      product.updatedAt = new Date().toISOString()
      applied += 1
    }
    return products
  })

  json(res, errors.length && applied === 0 ? 400 : 200, {
    ok: errors.length === 0,
    applied,
    errors,
    products: next.length
  })
}
