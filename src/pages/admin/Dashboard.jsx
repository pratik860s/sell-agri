import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { money, priceRange } from '../../lib/format.js'
import { useToast } from '../../components/admin/Toast.jsx'
import Icon from '../../components/Icon.jsx'
import Spinner from '../../components/Spinner.jsx'

export default function Dashboard() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [confirming, setConfirming] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .listProducts({ all: '1' })
      .then(({ products: list }) => setProducts(list))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    if (!needle) return products
    return products.filter((p) =>
      [p.name.hi, p.name.en, p.sku, p.brand, p.slug].filter(Boolean).some((f) => f.toLowerCase().includes(needle))
    )
  }, [products, query])

  const stats = useMemo(() => {
    const variants = products.flatMap((p) => p.variants)
    return {
      total: products.length,
      active: products.filter((p) => p.active).length,
      outOfStock: variants.filter((v) => v.stock <= 0).length,
      lowStock: variants.filter((v) => v.stock > 0 && v.stock <= 10).length
    }
  }, [products])

  const toggleActive = async (product) => {
    setBusyId(product.id)
    try {
      const { product: saved } = await api.updateProduct(product.id, { ...product, active: !product.active })
      setProducts((list) => list.map((p) => (p.id === saved.id ? saved : p)))
      toast.success(saved.active ? 'Product is now visible on the site' : 'Product hidden from the site')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (product) => {
    setBusyId(product.id)
    try {
      await api.deleteProduct(product.id)
      setProducts((list) => list.filter((p) => p.id !== product.id))
      toast.success('Product deleted')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
      setConfirming(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Add, edit and publish what appears on the site.</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Icon name="plus" size={19} />
          Add product
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Products', value: stats.total, tone: 'text-slate-900' },
          { label: 'Live on site', value: stats.active, tone: 'text-agri-600' },
          { label: 'Low stock', value: stats.lowStock, tone: 'text-amber-600' },
          { label: 'Out of stock', value: stats.outOfStock, tone: 'text-red-600' }
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, SKU or brand…"
          className="field pl-11"
        />
      </div>

      {loading ? (
        <Spinner label="Loading products…" />
      ) : (
        <div className="card overflow-hidden">
          <div className="scroll-x">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Packs</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Live</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const range = priceRange(p)
                  const stock = p.variants.reduce((sum, v) => sum + v.stock, 0)
                  return (
                    <tr key={p.id} className={busyId === p.id ? 'opacity-50' : ''}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 leading-tight">{p.name.hi}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.name.en}</p>
                        {p.sku && <p className="text-[11px] text-slate-400 mt-0.5">{p.sku}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{p.type}</td>
                      <td className="px-4 py-3 text-slate-600">{p.variants.length}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {range ? (range.multiple ? `${money(range.min)} – ${money(range.max)}` : money(range.min)) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${stock === 0 ? 'text-red-600' : stock <= 10 ? 'text-amber-600' : 'text-slate-700'}`}
                        >
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(p)}
                          disabled={busyId === p.id}
                          role="switch"
                          aria-checked={p.active}
                          aria-label={p.active ? 'Hide from site' : 'Show on site'}
                          className={`relative w-11 h-6 rounded-full transition ${p.active ? 'bg-agri-500' : 'bg-slate-300'}`}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                              p.active ? 'left-[22px]' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/product/${p.slug}`}
                            target="_blank"
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Preview"
                          >
                            <Icon name="eye" size={17} />
                          </Link>
                          <Link
                            to={`/admin/products/${p.id}`}
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-agri-600"
                            aria-label="Edit"
                          >
                            <Icon name="pencil" size={17} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirming(p)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete"
                          >
                            <Icon name="trash" size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <p className="px-4 py-12 text-center text-sm text-slate-500">
              {query ? 'No products matched that search.' : 'No products yet — add your first one.'}
            </p>
          )}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-pop-in">
            <h2 className="text-lg font-bold text-slate-900">Delete this product?</h2>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold">{confirming.name.hi}</span> will be removed from the catalogue and
              from <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">data/products.json</code>. This cannot be undone
              from here — you would have to revert the commit in GitHub.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirming(null)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => remove(confirming)}
                className="btn bg-red-600 hover:bg-red-700 text-white px-5 py-2.5"
              >
                <Icon name="trash" size={17} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
