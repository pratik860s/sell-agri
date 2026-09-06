import { guardMethod, body, fail, json, wrap } from '../_lib/http.js'
import { verifyCredentials, createSession, sessionCookie, rateLimit, clearRateLimit } from '../_lib/auth.js'

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['POST'])) return

  const limit = rateLimit(req)
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter))
    return fail(res, 429, 'Too many sign-in attempts. Please try again later.', {
      retryAfter: limit.retryAfter
    })
  }

  const { username, password } = body(req)
  const ok = await verifyCredentials(username, password)
  if (!ok) return fail(res, 401, 'Invalid username or password')

  clearRateLimit(req)
  const token = await createSession(String(username).trim())
  res.setHeader('Set-Cookie', sessionCookie(token))
  json(res, 200, { ok: true, username: String(username).trim() })
})
