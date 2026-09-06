import { guardMethod, body, fail, json, wrap } from './_lib/http.js'
import { readData, writeData } from './_lib/store.js'
import { requireAdmin } from './_lib/auth.js'
import { i18nField, slugify } from './_lib/validate.js'

const PUBLIC_CACHE = 's-maxage=60, stale-while-revalidate=600'

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['GET', 'PUT'])) return

  if (req.method === 'GET') {
    const { data } = await readData('categories.json', { fresh: req.query?.fresh === '1' })
    return json(res, 200, { categories: data }, PUBLIC_CACHE)
  }

  if (!(await requireAdmin(req, res))) return

  const { categories } = body(req)
  if (!Array.isArray(categories)) return fail(res, 400, 'Provide a "categories" array')

  const normalised = categories.map((c, i) => ({
    id: slugify(c.id || c.name?.en || c.name?.hi),
    type: c.type || 'fertilizer',
    name: i18nField(c.name),
    order: Number.isFinite(Number(c.order)) ? Number(c.order) : i + 1
  }))

  const seen = new Set()
  for (const c of normalised) {
    if (!c.name.hi && !c.name.en) return fail(res, 400, 'Every category needs a name')
    if (seen.has(c.id)) return fail(res, 400, `Duplicate category id "${c.id}"`)
    seen.add(c.id)
  }

  normalised.sort((a, b) => a.order - b.order)
  await writeData('categories.json', normalised, 'admin: update categories')
  json(res, 200, { categories: normalised })
})
