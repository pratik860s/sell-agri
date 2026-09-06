import { guardMethod, body, fail, json, wrap } from './_lib/http.js'
import { readData, writeData } from './_lib/store.js'
import { requireAdmin } from './_lib/auth.js'
import { i18nField } from './_lib/validate.js'

const PUBLIC_CACHE = 's-maxage=60, stale-while-revalidate=600'

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['GET', 'PUT'])) return

  if (req.method === 'GET') {
    const { data } = await readData('settings.json', { fresh: req.query?.fresh === '1' })
    return json(res, 200, { settings: data }, PUBLIC_CACHE)
  }

  if (!(await requireAdmin(req, res))) return

  const incoming = body(req).settings
  if (!incoming || typeof incoming !== 'object') return fail(res, 400, 'Provide a "settings" object')

  // wa.me needs the number in international form with no "+", spaces or dashes.
  const whatsappNumber = String(incoming.whatsappNumber ?? '').replace(/\D/g, '')
  if (whatsappNumber && (whatsappNumber.length < 10 || whatsappNumber.length > 15)) {
    return fail(res, 400, 'WhatsApp number must be 10–15 digits including the country code (e.g. 919876543210)')
  }

  const { data: current } = await readData('settings.json', { fresh: true })

  const next = {
    ...current,
    whatsappNumber: whatsappNumber || current.whatsappNumber,
    whatsappHours: i18nField(incoming.whatsappHours ?? current.whatsappHours),
    youtubeUrl: String(incoming.youtubeUrl ?? current.youtubeUrl ?? '').trim(),
    phone: String(incoming.phone ?? current.phone ?? '').trim(),
    email: String(incoming.email ?? current.email ?? '').trim(),
    address: i18nField(incoming.address ?? current.address),
    brand: {
      name: String(incoming.brand?.name ?? current.brand?.name ?? '').trim(),
      tagline: i18nField(incoming.brand?.tagline ?? current.brand?.tagline)
    },
    hero: {
      badge: i18nField(incoming.hero?.badge ?? current.hero?.badge),
      title: i18nField(incoming.hero?.title ?? current.hero?.title),
      titleAccent: i18nField(incoming.hero?.titleAccent ?? current.hero?.titleAccent),
      subtitle: i18nField(incoming.hero?.subtitle ?? current.hero?.subtitle)
    },
    messageTemplate: i18nField(incoming.messageTemplate ?? current.messageTemplate),
    soilMessageTemplate: i18nField(incoming.soilMessageTemplate ?? current.soilMessageTemplate),
    updatedAt: new Date().toISOString()
  }

  await writeData('settings.json', next, 'admin: update site settings')
  json(res, 200, { settings: next })
})
