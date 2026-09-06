import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useToast } from '../../components/admin/Toast.jsx'
import BilingualField from '../../components/admin/BilingualField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import Icon from '../../components/Icon.jsx'
import Spinner from '../../components/Spinner.jsx'

const TYPES = ['fertilizer', 'pesticide', 'seed', 'equipment']
const pair = () => ({ hi: '', en: '' })

const blankVariant = () => ({
  id: `v_${Math.random().toString(36).slice(2, 8)}`,
  label: pair(),
  mrp: '',
  price: '',
  stock: 0,
  unit: 'pack',
  active: true
})

const blankProduct = () => ({
  slug: '',
  sku: '',
  type: 'fertilizer',
  category: '',
  brand: '',
  technical: '',
  name: pair(),
  shortDesc: pair(),
  description: pair(),
  usage: pair(),
  dosage: pair(),
  safetyNotes: pair(),
  crops: [],
  images: [],
  variants: [blankVariant()],
  featured: false,
  active: true
})

export default function ProductEdit() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(blankProduct)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])
  const [cropsText, setCropsText] = useState('')

  useEffect(() => {
    api.getCategories().then(({ categories: list }) => setCategories(list)).catch(() => {})
  }, [])

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    api
      .getProduct(id, { all: '1' })
      .then(({ product }) => {
        setForm(product)
        setCropsText((product.crops || []).join(', '))
      })
      .catch((err) => {
        toast.error(err.message)
        navigate('/admin/products', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, isNew]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setVariant = (index, patch) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v))
    }))

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, blankVariant()] }))
  const removeVariant = (index) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors([])

    const payload = {
      ...form,
      crops: cropsText.split(',').map((c) => c.trim()).filter(Boolean),
      variants: form.variants.map((v) => ({
        ...v,
        mrp: v.mrp === '' ? 0 : Number(v.mrp),
        price: v.price === '' ? 0 : Number(v.price),
        stock: v.stock === '' ? 0 : Number(v.stock)
      }))
    }

    try {
      if (isNew) {
        const { product } = await api.createProduct(payload)
        toast.success('Product created and committed')
        navigate(`/admin/products/${product.id}`, { replace: true })
      } else {
        const { product } = await api.updateProduct(id, payload)
        setForm(product)
        toast.success('Changes saved and committed')
      }
    } catch (err) {
      setErrors(err.details?.length ? err.details : [err.message])
      toast.error(err.details?.length ? 'Please fix the errors listed on the form' : err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading product…" />

  const categoryOptions = categories.filter((c) => c.type === form.type)

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-agri-600">
            <Icon name="arrowLeft" size={17} />
            Products
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            {isNew ? 'Add product' : form.name.hi || form.name.en || 'Edit product'}
          </h1>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          <Icon name={saving ? 'spinner' : 'save'} size={19} />
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="font-bold text-red-800 flex items-center gap-2 text-sm">
            <Icon name="alert" size={17} /> Could not save
          </p>
          <ul className="mt-2 space-y-1 text-sm text-red-700 list-disc list-inside">
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-slate-900">Basics</h2>

        <BilingualField
          label="Product name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder={{ hi: 'यूरिया (नीम कोटेड)', en: 'Urea (Neem Coated)' }}
        />

        <BilingualField
          label="Short description"
          value={form.shortDesc}
          onChange={set('shortDesc')}
          hint="One line — this is what shows on the product card."
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="label">Type <span className="text-red-500">*</span></label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, category: '' }))}
              className="field"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="label">Category</label>
            <select id="category" value={form.category} onChange={setInput('category')} className="field">
              <option value="">— none —</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name.en}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="brand" className="label">Brand</label>
            <input id="brand" value={form.brand} onChange={setInput('brand')} placeholder="IFFCO" className="field" />
          </div>
          <div>
            <label htmlFor="sku" className="label">Product code (SKU)</label>
            <input id="sku" value={form.sku} onChange={setInput('sku')} placeholder="FRT-URE-001" className="field" />
          </div>
          <div>
            <label htmlFor="technical" className="label">Technical name</label>
            <input id="technical" value={form.technical} onChange={setInput('technical')} placeholder="46% N" className="field" />
          </div>
          <div>
            <label htmlFor="slug" className="label">URL slug</label>
            <input
              id="slug"
              value={form.slug}
              onChange={setInput('slug')}
              placeholder="auto-generated from the English name"
              className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="crops" className="label">Suitable crops</label>
          <input
            id="crops"
            value={cropsText}
            onChange={(e) => setCropsText(e.target.value)}
            placeholder="wheat, rice, sugarcane"
            className="field"
          />
          <p className="mt-1.5 text-xs text-slate-500">Separate with commas.</p>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <ImageUploader images={form.images} onChange={set('images')} />
      </section>

      <section className="card p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Pack sizes &amp; pricing</h2>
            <p className="text-sm text-slate-500 mt-0.5">Each pack size is priced and stocked separately.</p>
          </div>
          <button type="button" onClick={addVariant} className="btn-ghost shrink-0">
            <Icon name="plus" size={18} />
            Add pack
          </button>
        </div>

        <div className="space-y-4">
          {form.variants.map((v, i) => (
            <div key={v.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Pack {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={v.active !== false}
                      onChange={(e) => setVariant(i, { active: e.target.checked })}
                      className="w-4 h-4 rounded accent-agri-600"
                    />
                    Visible
                  </label>
                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove pack ${i + 1}`}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </div>

              <BilingualField
                label="Pack label"
                required
                value={v.label}
                onChange={(label) => setVariant(i, { label })}
                placeholder={{ hi: '45 किग्रा बैग', en: '45 kg Bag' }}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="label">MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={v.mrp}
                    onChange={(e) => setVariant(i, { mrp: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label">Selling price (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={v.price}
                    onChange={(e) => setVariant(i, { price: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label">Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={v.stock}
                    onChange={(e) => setVariant(i, { stock: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input
                    value={v.unit}
                    onChange={(e) => setVariant(i, { unit: e.target.value })}
                    placeholder="bag"
                    className="field"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-slate-900">Details shown on the product page</h2>
        <BilingualField label="Full description" textarea rows={5} value={form.description} onChange={set('description')} />
        <BilingualField label="How to use" textarea rows={4} value={form.usage} onChange={set('usage')} />
        <BilingualField label="Dosage" value={form.dosage} onChange={set('dosage')} placeholder={{ hi: '50 किग्रा प्रति एकड़', en: '50 kg per acre' }} />
        <BilingualField
          label="Safety precautions"
          textarea
          rows={4}
          value={form.safetyNotes}
          onChange={set('safetyNotes')}
          hint="Shown in an amber warning box. Important for pesticides."
        />
      </section>

      <section className="card p-5 sm:p-6 space-y-4">
        <h2 className="font-bold text-slate-900">Visibility</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="mt-1 w-4 h-4 rounded accent-agri-600"
          />
          <span>
            <span className="block font-semibold text-slate-800 text-sm">Live on the site</span>
            <span className="block text-xs text-slate-500">Uncheck to hide this product without deleting it.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            className="mt-1 w-4 h-4 rounded accent-agri-600"
          />
          <span>
            <span className="block font-semibold text-slate-800 text-sm">Featured on the home page</span>
            <span className="block text-xs text-slate-500">The first four featured products appear on the home page.</span>
          </span>
        </label>
      </section>

      {/* Sticky save bar so the button is reachable from anywhere in a long form. */}
      <div className="fixed bottom-0 inset-x-0 lg:left-64 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex justify-end gap-3 z-30">
        <Link to="/admin/products" className="btn-ghost">Cancel</Link>
        <button type="submit" disabled={saving} className="btn-primary">
          <Icon name={saving ? 'spinner' : 'save'} size={19} />
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
