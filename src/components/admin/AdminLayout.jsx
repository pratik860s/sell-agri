import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthProvider.jsx'
import Icon from '../Icon.jsx'

const NAV = [
  { to: '/admin/products', label: 'Products', icon: 'box' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'list' },
  { to: '/admin/categories', label: 'Categories', icon: 'grid' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' }
]

export default function AdminLayout() {
  const { user, storage, checking, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Icon name="spinner" size={32} />
      </div>
    )
  }
  if (!user) return <Navigate to="/admin" replace />

  const onLogout = async () => {
    await logout()
    navigate('/admin', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
      isActive ? 'bg-agri-500 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`

  const sidebar = (
    <>
      <Link to="/admin/products" className="flex items-center gap-3 px-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-agri-500 to-emerald-400 flex items-center justify-center text-xl">
          🌱
        </div>
        <div>
          <p className="text-white font-bold leading-tight">Rajat Kisan</p>
          <p className="text-[11px] text-slate-400">Admin panel</p>
        </div>
      </Link>

      <nav className="space-y-1.5 flex-1">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setOpen(false)}>
            <Icon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
        {/* Makes it obvious whether saves are committing to GitHub or only to local disk. */}
        <div
          className={`text-[11px] px-3 py-2 rounded-lg border ${
            storage === 'github'
              ? 'bg-agri-500/10 border-agri-500/25 text-agri-300'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
          }`}
        >
          <span className="font-bold block">
            {storage === 'github' ? 'Saving to GitHub' : 'Saving to local disk'}
          </span>
          <span className="opacity-80">
            {storage === 'github' ? 'Edits commit to data/*.json' : 'Development mode — not deployed'}
          </span>
        </div>

        <p className="text-xs text-slate-400 px-3">
          Signed in as <span className="text-white font-semibold">{user}</span>
        </p>

        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition"
        >
          <Icon name="eye" size={18} />
          View site
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          <Icon name="logout" size={18} />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-agri-dark p-4 flex-col">{sidebar}</aside>

      <div className="lg:hidden sticky top-0 z-40 bg-agri-dark text-white flex items-center justify-between px-4 h-16">
        <Link to="/admin/products" className="flex items-center gap-2.5 font-bold">
          <span className="text-xl">🌱</span> Admin
        </Link>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu" className="p-2 -mr-2">
          <Icon name={open ? 'close' : 'menu'} size={24} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="relative w-72 max-w-[85vw] bg-agri-dark p-4 flex flex-col animate-fade-in">{sidebar}</aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
