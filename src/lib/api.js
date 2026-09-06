/** Thin fetch wrapper. Every call goes to the /api serverless functions on the same origin. */

class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    signal,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })

  const text = await res.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    throw new ApiError(`Unexpected response from the server (${res.status})`, res.status)
  }

  if (!res.ok) {
    throw new ApiError(payload.error || `Request failed (${res.status})`, res.status, payload.details)
  }
  return payload
}

const qs = (params) => {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') search.set(k, v)
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}

export const api = {
  // public
  listProducts: (params, signal) => request(`/products${qs(params)}`, { signal }),
  getProduct: (idOrSlug, params, signal) => request(`/products/${encodeURIComponent(idOrSlug)}${qs(params)}`, { signal }),
  getCategories: (signal) => request('/categories', { signal }),
  getSettings: (signal) => request('/settings', { signal }),

  // auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: (signal) => request('/auth/me', { signal }),

  // admin
  createProduct: (product) => request('/products', { method: 'POST', body: product }),
  updateProduct: (id, product) => request(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: product }),
  deleteProduct: (id) => request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getInventory: (signal) => request('/inventory', { signal }),
  saveInventory: (updates) => request('/inventory', { method: 'PATCH', body: { updates } }),
  saveCategories: (categories) => request('/categories', { method: 'PUT', body: { categories } }),
  saveSettings: (settings) => request('/settings', { method: 'PUT', body: { settings } }),
  uploadImage: (filename, dataUrl) => request('/upload', { method: 'POST', body: { filename, dataUrl } })
}

export { ApiError }
