/** Small helpers shared by every route handler. */

export function json(res, status, body, cacheControl) {
  res.status(status)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cacheControl || 'no-store')
  res.end(JSON.stringify(body))
}

export function fail(res, status, message, extra = {}) {
  json(res, status, { error: message, ...extra })
}

/** Answers OPTIONS and rejects anything outside `allowed`. Returns true if the route should stop. */
export function guardMethod(req, res, allowed) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', allowed.join(', '))
    res.status(204).end()
    return true
  }
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '))
    fail(res, 405, `Method ${req.method} not allowed`)
    return true
  }
  return false
}

/** Vercel parses JSON bodies; the local dev plugin does too. This covers the raw-string case. */
export function body(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

export function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      console.error(`[api] ${req.method} ${req.url}`, err)
      if (!res.writableEnded) fail(res, 500, err.message || 'Internal server error')
    }
  }
}
