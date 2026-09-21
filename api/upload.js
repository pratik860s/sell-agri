/**
 * Image upload. The browser resizes to WebP before posting, so the payload that
 * reaches here is small. In production the file is committed to public/products/
 * and served over the free jsDelivr GitHub CDN, which means a new image is live
 * immediately without waiting for a redeploy.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { guardMethod, body, fail, json, wrap } from './_lib/http.js'
import { requireAdmin } from './_lib/auth.js'
import * as github from './_lib/github.js'
import { assertWritable } from './_lib/store.js'
import { slugify } from './_lib/validate.js'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }

export default wrap(async (req, res) => {
  if (guardMethod(req, res, ['POST'])) return
  if (!(await requireAdmin(req, res))) return
  assertWritable()

  const { dataUrl, filename } = body(req)
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return fail(res, 400, 'Provide the image as a base64 data URL in "dataUrl"')
  }

  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl)
  if (!match) return fail(res, 400, 'Malformed data URL')

  const [, mime, base64] = match
  const ext = ALLOWED[mime]
  if (!ext) return fail(res, 400, `Unsupported image type "${mime}". Use WebP, JPEG or PNG.`)

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length === 0) return fail(res, 400, 'Empty image')
  if (buffer.length > MAX_BYTES) {
    return fail(res, 413, `Image is ${(buffer.length / 1024 / 1024).toFixed(1)} MB — the limit is 2 MB.`)
  }

  const stem = slugify(String(filename || 'product').replace(/\.[a-z0-9]+$/i, '')).slice(0, 48)
  const name = `${stem || 'product'}-${Date.now().toString(36)}.${ext}`
  const repoPath = `public/products/${name}`

  if (!github.isConfigured()) {
    const dir = path.resolve(process.cwd(), 'public/products')
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, name), buffer)
    return json(res, 201, { url: `/products/${name}`, path: repoPath, storage: 'local' })
  }

  await github.putFileBase64(repoPath, base64, `admin: upload product image ${name}`)

  json(res, 201, { url: github.cdnUrl(repoPath), path: repoPath, storage: 'github' })
})
