import { guardMethod, json, wrap } from '../_lib/http.js'
import { getSession } from '../_lib/auth.js'
import { storageMode } from '../_lib/store.js'

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['GET'])) return

  const session = await getSession(req)
  if (!session) return json(res, 401, { authenticated: false })

  json(res, 200, {
    authenticated: true,
    username: session.sub,
    // Surfaced in the admin UI so it is obvious whether saves commit to GitHub,
    // write to the local disk, or cannot be saved at all on this deployment.
    storage: storageMode()
  })
})
