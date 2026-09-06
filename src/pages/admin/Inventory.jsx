import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api.js'
import { money, LOW_STOCK } from '../../lib/format.js'
import { useToast } from '../../components/admin/Toast.jsx'
import Icon from '../../components/Icon.jsx'
import Spinner from '../../components/Spinner.jsx'

const key = (row) => `${row.productId}:${row.variantId}`

/**
 * Spreadsheet-style price and stock editing. Every change is buffered locally and
 * saved as a single commit, so editing thirty prices does not create thirty commits.
 */
export default function Inventory() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [edits, setEdits] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [onlyProblems, setOnlyProblems] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .getInventory()
      .then(({ rows: list }) => {
        setRows(list)
        setEdits({})
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const valueFor = (row, field) => {
    const edit = edits[key(row)]
    return edit && edit[field] !== undefined ? edit[field] : row[field]
  }

  const change = (row, field, value) =>
    setEdits((current) => {
      const k = key(row)
      const next = { ...(current[k] || {}), [field]: value }

      // Drop the entry entirely once every field is back to its original value.
      const unchanged = Object.entries(next).every(([f, v]) => String(v) === String(row[f]))
      if (unchanged) {
        const { [k]: _drop, ...rest } = current
        return rest
      }
      return { ...current, [k]: next }
    })

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    return rows.filter((row) => {
      if (onlyProblems && Number(valueFor(row, 'stock')) > LOW_STOCK) return false
      if (!needle) return true
      return [row.productName.hi, row.productName.en, row.sku, row.label.hi, row.label.en]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(needle))
    })
  }, [rows, query, onlyProblems, edits])

  const dirtyCount = Object.keys(edits).length

  const save = async () => {
    if (!dirtyCount) return
    setSaving(true)
    try {
      const updates = Object.entries(edits).map(([k, patch]) => {
        const [productId, variantId] = k.split(':')
        const update = { productId, variantId }
        if (patch.price !== undefined) update.price = Number(patch.price)
        if (patch.mrp !== undefined) update.mrp = Number(patch.mrp)
        if (patch.stock !== undefined) update.stock = Number(patch.stock)
        if (patch.active !== undefined) update.active = patch.active
        return update
      })

      const result = await api.saveInventory(updates)
      if (result.errors?.length) {
        toast.error(`${result.applied} saved, ${result.errors.length} rejected:\n${result.errors.slice(0, 4).join('\n')}`)
      } else {
        toast.success(`${result.applied} change${result.applied === 1 ? '' : 's'} saved in one commit`)
      }
      load()
    } catch (err) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading inventory…" />

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Edit prices and stock inline. Everything you change is saved together as one commit.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product or pack…"
            className="field pl-11"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlyProblems}
            onChange={(e) => setOnlyProblems(e.target.checked)}
            className="w-4 h-4 rounded accent-agri-600"
          />
          Low / out of stock only
        </label>
        <button type="button" onClick={load} className="btn-ghost shrink-0">
          <Icon name="refresh" size={17} />
          Reload
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="scroll-x">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Pack</th>
                <th className="px-4 py-3 font-semibold w-28">MRP</th>
                <th className="px-4 py-3 font-semibold w-28">Price</th>
                <th className="px-4 py-3 font-semibold w-24">Stock</th>
                <th className="px-4 py-3 font-semibold w-20">Visible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const dirty = Boolean(edits[key(row)])
                const stock = Number(valueFor(row, 'stock'))
                return (
                  <tr key={key(row)} className={dirty ? 'bg-amber-50/70' : ''}>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-900 leading-tight">{row.productName.hi}</p>
                      <p className="text-xs text-slate-500">{row.productName.en}</p>
                      {!row.productActive && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded mt-1 inline-block">
                          HIDDEN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {row.label.hi}
                      <span className="block text-xs text-slate-400">{row.label.en}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valueFor(row, 'mrp')}
                        onChange={(e) => change(row, 'mrp', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-agri-500 focus:border-agri-500 outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valueFor(row, 'price')}
                        onChange={(e) => change(row, 'price', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-agri-500 focus:border-agri-500 outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={valueFor(row, 'stock')}
                        onChange={(e) => change(row, 'stock', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border font-semibold outline-none focus:ring-2 focus:ring-agri-500 focus:border-agri-500 ${
                          stock <= 0
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : stock <= LOW_STOCK
                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                              : 'border-slate-300'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={valueFor(row, 'active') !== false}
                        onChange={(e) => change(row, 'active', e.target.checked)}
                        className="w-5 h-5 rounded accent-agri-600"
                        aria-label="Variant visible"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-slate-500">No rows match that filter.</p>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 lg:left-64 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 z-30">
        <p className="text-sm text-slate-600">
          {dirtyCount === 0 ? (
            'No unsaved changes'
          ) : (
            <span className="font-semibold text-amber-700">
              {dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}
            </span>
          )}
        </p>
        <div className="flex gap-3">
          {dirtyCount > 0 && (
            <button type="button" onClick={() => setEdits({})} className="btn-ghost">
              Discard
            </button>
          )}
          <button type="button" onClick={save} disabled={!dirtyCount || saving} className="btn-primary">
            <Icon name={saving ? 'spinner' : 'save'} size={19} />
            {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>
    </div>
  )
}
