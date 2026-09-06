/**
 * Reads and writes the JSON "database".
 *
 *   development  -> plain fs against ./data
 *   production   -> GitHub Contents API (Vercel's disk is read-only)
 *
 * Reads are memoised for CACHE_TTL so a burst of page views costs one GitHub
 * call, not hundreds. The admin panel passes { fresh: true } to skip it.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import * as github from './github.js'

const DATA_DIR = 'data'
const CACHE_TTL = 30_000
const cache = new Map() // file -> { data, sha, at }

export const usingGitHub = () => github.isConfigured()

function localPath(file) {
  return path.resolve(process.cwd(), DATA_DIR, file)
}

export async function readData(file, { fresh = false } = {}) {
  if (!usingGitHub()) {
    const raw = await fs.readFile(localPath(file), 'utf8')
    return { data: JSON.parse(raw), sha: null }
  }

  const hit = cache.get(file)
  if (!fresh && hit && Date.now() - hit.at < CACHE_TTL) {
    return { data: structuredClone(hit.data), sha: hit.sha }
  }

  const found = await github.getFile(`${DATA_DIR}/${file}`)
  if (!found) throw new Error(`${DATA_DIR}/${file} not found in the repository`)

  const data = JSON.parse(found.content)
  cache.set(file, { data: structuredClone(data), sha: found.sha, at: Date.now() })
  return { data, sha: found.sha }
}

export async function writeData(file, data, message) {
  const json = JSON.stringify(data, null, 2) + '\n'

  if (!usingGitHub()) {
    await fs.writeFile(localPath(file), json, 'utf8')
    return { local: true }
  }

  const current = cache.get(file)
  let sha = current?.sha
  if (!sha) {
    const found = await github.getFile(`${DATA_DIR}/${file}`)
    sha = found?.sha
  }

  try {
    const result = await github.putFile(`${DATA_DIR}/${file}`, json, message, sha)
    cache.set(file, { data: structuredClone(data), sha: result.sha, at: Date.now() })
    return result
  } catch (err) {
    if (err.code !== 'CONFLICT') throw err
    // Someone committed between our read and our write. Refresh the sha once and retry.
    cache.delete(file)
    const found = await github.getFile(`${DATA_DIR}/${file}`)
    const result = await github.putFile(`${DATA_DIR}/${file}`, json, message, found?.sha)
    cache.set(file, { data: structuredClone(data), sha: result.sha, at: Date.now() })
    return result
  }
}

/**
 * Read → mutate → write as one unit, so a failed write never leaves a partially
 * applied change in the cache.
 */
export async function mutate(file, message, mutator) {
  const { data } = await readData(file, { fresh: true })
  const next = await mutator(structuredClone(data))
  await writeData(file, next, message)
  return next
}

export function invalidate(file) {
  if (file) cache.delete(file)
  else cache.clear()
}
