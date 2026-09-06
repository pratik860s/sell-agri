import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { useToast } from '../../components/admin/Toast.jsx'
import Icon from '../../components/Icon.jsx'
import Spinner from '../../components/Spinner.jsx'

const TYPES = ['fertilizer', 'pesticide', 'seed', 'equipment']

export default function Categories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getCategories()
      .then(({ categories: list }) => setCategories(list))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (index, patch) =>
    setCategories((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)))

  const add = () =>
    setCategories((list) => [
      ...list,
      { id: '', type: 'fertilizer', name: { hi: '', en: '' }, order: list.length + 1 }
    ])

  const move = (from, to) => {
    if (to < 0 || to >= categories.length) return
    setCategories((list) => {
      const next = [...list]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next.map((c, i) => ({ ...c, order: i + 1 }))
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const { categories: saved } = await api.saveCategories(
        categories.map((c, i) => ({ ...c, order: i + 1 }))
      )
      setCategories(saved)
      toast.success('Categories saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading categories…" />

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">These fill the filter dropdown on the products page.</p>
        </div>
        <button type="button" onClick={add} className="btn-ghost">
          <Icon name="plus" size={18} />
          Add category
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((c, i) => (
          <div key={i} className="card p-4 grid gap-3 sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-end">
            <div className="flex sm:flex-col gap-1">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="p-1.5 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up">
                <Icon name="chevronDown" size={16} className="rotate-180" />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === categories.length - 1} className="p-1.5 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down">
                <Icon name="chevronDown" size={16} />
              </button>
            </div>

            <div>
              <label className="label">Name (हिंदी)</label>
              <input
                value={c.name.hi}
                onChange={(e) => update(i, { name: { ...c.name, hi: e.target.value } })}
                className="field"
                lang="hi"
              />
            </div>
            <div>
              <label className="label">Name (English)</label>
              <input
                value={c.name.en}
                onChange={(e) => update(i, { name: { ...c.name, en: e.target.value } })}
                className="field"
              />
            </div>
            <div>
              <label className="label">Belongs to</label>
              <select value={c.type} onChange={(e) => update(i, { type: e.target.value })} className="field">
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setCategories((list) => list.filter((_, j) => j !== i))}
              className="p-2.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 justify-self-start"
              aria-label="Remove category"
            >
              <Icon name="trash" size={18} />
            </button>

            <p className="sm:col-start-2 sm:col-span-4 text-xs text-slate-400 -mt-1">
              id: <code className="bg-slate-100 px-1 rounded">{c.id || 'auto-generated from the English name'}</code>
              {c.id && ' — changing the name keeps this id, so existing products stay linked.'}
            </p>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 inset-x-0 lg:left-64 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex justify-end z-30">
        <button type="button" onClick={save} disabled={saving} className="btn-primary">
          <Icon name={saving ? 'spinner' : 'save'} size={19} />
          {saving ? 'Saving…' : 'Save categories'}
        </button>
      </div>
    </div>
  )
}
