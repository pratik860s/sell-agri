/**
 * Runs the /api serverless functions inside the Vite dev server so that
 * `npm run dev` gives the same routing as Vercel, without the Vercel CLI.
 *
 * Handlers are re-imported on every request (cache-busted), so editing a file
 * under /api takes effect immediately with no restart.
 */
import fs from 'node:fs'
import path from 'node:path'

const API_DIR = path.resolve(process.cwd(), 'api')

/** Resolve "/api/products/urea-x" -> { file, params } using Vercel's [param] convention. */
function resolveRoute(segments, dir = API_DIR, params = {}) {
  if (!fs.existsSync(dir)) return null

  if (segments.length === 0) {
    const index = path.join(dir, 'index.js')
    return fs.existsSync(index) ? { file: index, params } : null
  }

  const [head, ...rest] = segments
  const entries = fs.readdirSync(dir)

  // 1. exact file match (only valid when it is the last segment)
  if (rest.length === 0 && entries.includes(`${head}.js`)) {
    return { file: path.join(dir, `${head}.js`), params }
  }
  // 2. exact directory match
  if (entries.includes(head) && fs.statSync(path.join(dir, head)).isDirectory()) {
    const hit = resolveRoute(rest, path.join(dir, head), params)
    if (hit) return hit
  }
  // 3. dynamic [param] file, last segment only
  const dynFile = entries.find((e) => e.startsWith('[') && e.endsWith('].js'))
  if (rest.length === 0 && dynFile) {
    const key = dynFile.slice(1, -4)
    return { file: path.join(dir, dynFile), params: { ...params, [key]: decodeURIComponent(head) } }
  }
  // 4. dynamic [param] directory
  const dynDir = entries.find(
    (e) => e.startsWith('[') && e.endsWith(']') && fs.statSync(path.join(dir, e)).isDirectory()
  )
  if (dynDir) {
    const key = dynDir.slice(1, -1)
    return resolveRoute(rest, path.join(dir, dynDir), { ...params, [key]: decodeURIComponent(head) })
  }
  return null
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > 12 * 1024 * 1024) reject(new Error('Payload too large'))
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** Give the raw Node req/res the small surface Vercel's Node handlers expect. */
function decorate(req, res, url, params) {
  req.query = { ...params }
  for (const [k, v] of url.searchParams) req.query[k] = v

  req.cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=')
        return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]
      })
  )

  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (body) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
    return res
  }
  res.send = (body) => {
    if (typeof body === 'object' && body !== null) return res.json(body)
    res.end(String(body ?? ''))
    return res
  }
}

/**
 * Minimal .env reader.
 *
 * Deliberately NOT Vite's loadEnv: that runs dotenv-expand, which treats "$" as
 * a variable reference and silently mangles a bcrypt hash ($2a$10$... becomes
 * garbage). Vercel injects env vars verbatim, so dev must too.
 */
function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

export default function apiPlugin() {
  return {
    name: 'local-vercel-api',

    /**
     * Vite only exposes VITE_-prefixed vars, and only to client code. The API
     * handlers read process.env the way they will on Vercel, so load the .env
     * files into process.env here. Real environment variables still win.
     */
    configResolved() {
      const files = ['.env', '.env.local']
      for (const file of files) {
        for (const [key, value] of Object.entries(parseEnvFile(path.resolve(process.cwd(), file)))) {
          process.env[key] = process.env[key] ?? value
        }
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/') && req.url !== '/api') return next()

        const url = new URL(req.url, 'http://localhost')
        const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
        const match = resolveRoute(segments)

        if (!match) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ error: `No API route for ${url.pathname}` }))
        }

        try {
          decorate(req, res, url, match.params)

          if (!['GET', 'HEAD', 'DELETE'].includes(req.method)) {
            const raw = await readBody(req)
            const type = req.headers['content-type'] || ''
            req.body = type.includes('application/json') && raw ? JSON.parse(raw) : raw || undefined
          }

          // Pass the raw absolute path: pathToFileURL would percent-encode the
          // brackets in [id].js and ssrLoadModule could not resolve it.
          const mod = await server.ssrLoadModule(match.file)
          await mod.default(req, res)
          if (!res.writableEnded) res.end()
        } catch (err) {
          server.config.logger.error(`[api] ${req.method} ${url.pathname}\n${err.stack || err}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
          }
          if (!res.writableEnded) res.end(JSON.stringify({ error: err.message }))
        }
      })
    }
  }
}
