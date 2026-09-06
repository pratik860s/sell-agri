/**
 * Builds the wa.me deep link that hands a farmer over to the seller with the
 * product already written into the message. This is the site's entire checkout.
 */
import { money } from './format.js'

const FALLBACK_TEMPLATE = {
  hi: 'नमस्ते 🌱\nमुझे इस उत्पाद की जानकारी चाहिए:\n\n📦 उत्पाद : {{product}}\n📐 पैक : {{variant}}\n💰 कीमत : {{price}}\n🔗 लिंक : {{url}}',
  en: 'Hello 🌱\nI would like details about this product:\n\n📦 Product : {{product}}\n📐 Pack : {{variant}}\n💰 Price : {{price}}\n🔗 Link : {{url}}'
}

function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => (vars[key] != null && vars[key] !== '' ? String(vars[key]) : '—'))
}

/** wa.me needs digits only — no "+", spaces or dashes. */
function normaliseNumber(raw) {
  return String(raw || '').replace(/\D/g, '')
}

export function whatsappLink(number, message) {
  const digits = normaliseNumber(number)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function productMessage({ settings, product, variant, lang, pick }) {
  const template = settings?.messageTemplate?.[lang] || FALLBACK_TEMPLATE[lang] || FALLBACK_TEMPLATE.en
  const url = `${window.location.origin}/product/${product.slug}`
  return fill(template, {
    product: pick(product.name),
    variant: variant ? pick(variant.label) : '—',
    price: variant ? money(variant.price) : '—',
    sku: product.sku || product.slug,
    url
  })
}

export function productWhatsAppUrl({ settings, product, variant, lang, pick }) {
  return whatsappLink(settings?.whatsappNumber, productMessage({ settings, product, variant, lang, pick }))
}

export function soilTestWhatsAppUrl({ settings, lang, values }) {
  const template =
    settings?.soilMessageTemplate?.[lang] ||
    (lang === 'hi'
      ? 'नमस्ते 🌱\nमुझे मिट्टी की जाँच करवानी है।\n\n👤 नाम : {{name}}\n📞 मोबाइल : {{phone}}\n📍 गाँव / जिला : {{location}}\n🌾 फसल : {{crop}}\n📐 रकबा : {{area}}'
      : 'Hello 🌱\nI would like to get my soil tested.\n\n👤 Name : {{name}}\n📞 Mobile : {{phone}}\n📍 Village / District : {{location}}\n🌾 Crop : {{crop}}\n📐 Area : {{area}}')
  return whatsappLink(settings?.whatsappNumber, fill(template, values))
}

/** Plain "chat with us" link with no product attached — used in the header and footer. */
export function generalWhatsAppUrl(settings, lang) {
  const greeting = lang === 'hi' ? 'नमस्ते 🌱 मुझे खेती से जुड़ी जानकारी चाहिए।' : 'Hello 🌱 I would like some farming advice.'
  return whatsappLink(settings?.whatsappNumber, greeting)
}
