/**
 * Single-admin authentication. Credentials live in env vars, the session is a
 * signed JWT in an HttpOnly cookie — no user table, no database.
 */
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const COOKIE = 'rk_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// A real hash of a random string. Compared against when the username is wrong so
// that a bad username and a bad password take the same amount of time.
const DECOY = '$2a$10$9HT/d1s2lWfAb2NX0ZnmUu6WaFyQSi0dhJmduOn0tLU4o6ZpowKC.'

function secret() {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET is missing or shorter than 32 characters.')
  }
  return new TextEncoder().encode(value)
}

// Per-instance only. Serverless spreads requests over several instances, so this
// slows an attacker down rather than stopping them outright — enough for one admin.
const attempts = new Map()
const WINDOW = 15 * 60 * 1000
const LIMIT = 5

export function rateLimit(req) {
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || now - entry.first > WINDOW) {
    attempts.set(ip, { count: 1, first: now })
    return { ok: true }
  }
  entry.count += 1
  if (entry.count > LIMIT) {
    return { ok: false, retryAfter: Math.ceil((WINDOW - (now - entry.first)) / 1000) }
  }
  return { ok: true }
}

export function clearRateLimit(req) {
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  attempts.delete(ip)
}

export async function verifyCredentials(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME
  const expectedHash = process.env.ADMIN_PASSWORD_HASH
  if (!expectedUser || !expectedHash) {
    throw new Error('ADMIN_USERNAME / ADMIN_PASSWORD_HASH are not configured.')
  }
  const userMatches = typeof username === 'string' && username.trim() === expectedUser
  const passwordMatches = await bcrypt.compare(String(password ?? ''), userMatches ? expectedHash : DECOY)
  return userMatches && passwordMatches
}

export async function createSession(username) {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())
}

export function sessionCookie(token) {
  const parts = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${MAX_AGE}`
  ]
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export function clearCookie() {
  const parts = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0']
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

function readCookie(req) {
  if (req.cookies?.[COOKIE]) return req.cookies[COOKIE]
  const header = req.headers.cookie || ''
  const found = header
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE}=`))
  return found ? decodeURIComponent(found.slice(COOKIE.length + 1)) : null
}

export async function getSession(req) {
  const token = readCookie(req)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload.role === 'admin' ? payload : null
  } catch {
    return null
  }
}

/** Ends the response with 401 and returns false when the caller is not the admin. */
export async function requireAdmin(req, res) {
  const session = await getSession(req)
  if (session) return true
  res.status(401)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: 'Not signed in' }))
  return false
}
