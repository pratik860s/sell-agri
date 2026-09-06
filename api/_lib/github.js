/**
 * Thin wrapper over the GitHub Contents API.
 *
 * This is the persistence layer in production: Vercel's filesystem is read-only,
 * so every admin write becomes a commit to data/*.json in the repository.
 */
const API = 'https://api.github.com'

function config() {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = process.env
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error(
      'GitHub storage is not configured. Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO.'
    )
  }
  return { token: GITHUB_TOKEN, owner: GITHUB_OWNER, repo: GITHUB_REPO, branch: GITHUB_BRANCH || 'main' }
}

export function isConfigured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO)
}

async function gh(url, init = {}) {
  const { token } = config()
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rajat-kisan-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers
    }
  })
  return res
}

/** @returns {Promise<{content: string, sha: string} | null>} null when the file does not exist yet. */
export async function getFile(filePath) {
  const { owner, repo, branch } = config()
  const url = `${API}/repos/${owner}/${repo}/contents/${encodeURI(filePath)}?ref=${encodeURIComponent(branch)}`
  const res = await gh(url)

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub read failed (${res.status}): ${await res.text()}`)

  const json = await res.json()
  return {
    content: Buffer.from(json.content, 'base64').toString('utf8'),
    sha: json.sha
  }
}

/**
 * Create or replace a file from already-base64-encoded content.
 *
 * `sha` must be the sha of the version being replaced — GitHub rejects the write
 * with 409 if someone else committed in the meantime, which is what makes
 * concurrent admin edits safe rather than last-write-wins.
 */
export async function putFileBase64(filePath, base64Content, message, sha) {
  const { owner, repo, branch } = config()
  const url = `${API}/repos/${owner}/${repo}/contents/${encodeURI(filePath)}`
  const res = await gh(url, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: base64Content,
      branch,
      ...(sha ? { sha } : {})
    })
  })

  if (res.status === 409 || res.status === 422) {
    const err = new Error('CONFLICT')
    err.code = 'CONFLICT'
    throw err
  }
  if (!res.ok) throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`)

  const json = await res.json()
  return { sha: json.content.sha, commit: json.commit.sha }
}

/** Create or replace a UTF-8 text file (the JSON data files). */
export function putFile(filePath, content, message, sha) {
  return putFileBase64(filePath, Buffer.from(content, 'utf8').toString('base64'), message, sha)
}

/** Public CDN URL for a file committed to the repo — live immediately, no redeploy. */
export function cdnUrl(filePath) {
  if (!isConfigured()) return '/' + filePath.replace(/^public\//, '')
  const { owner, repo, branch } = config()
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`
}
