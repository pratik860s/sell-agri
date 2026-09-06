import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthProvider.jsx'
import Icon from '../../components/Icon.jsx'

export default function Login() {
  const { user, checking, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (checking) return null
  if (user) return <Navigate to="/admin/products" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message || 'Sign in failed')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-agri-900 via-agri-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 text-white">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-agri-500 to-emerald-400 flex items-center justify-center text-2xl">
            🌱
          </div>
          <span className="text-xl font-bold">Rajat Kisan</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-7 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-agri-100 text-agri-700 flex items-center justify-center">
              <Icon name="lock" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Admin sign in</h1>
              <p className="text-xs text-slate-500">एडमिन लॉगिन</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="label">Username</label>
              <input
                id="username"
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={19} />
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <Icon name="alert" size={16} className="mt-0.5" />
                <span>{error}</span>
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy && <Icon name="spinner" size={18} />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <Icon name="arrowLeft" size={16} />
          Back to the site
        </Link>
      </div>
    </div>
  )
}
