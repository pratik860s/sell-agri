import { guardMethod, json, wrap } from '../_lib/http.js'
import { clearCookie } from '../_lib/auth.js'

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['POST'])) return
  res.setHeader('Set-Cookie', clearCookie())
  json(res, 200, { ok: true })
})
