// Spotify Web API helpers shared by the auth and fetch scripts. Uses Node's
// built-in global fetch (Node 18+). All token material stays in env/CI secrets.

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'

function basicAuth(clientId, clientSecret) {
  return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

// Exchange a long-lived refresh token for a short-lived (1 hour) access token.
// Throws on invalid_grant so the caller can surface a clear "re-authorize" error.
export async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuth(clientId, clientSecret),
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const reason = data.error || res.status
    throw new Error(`Token refresh failed (${reason}). If this is invalid_grant, re-run "npm run auth" and update the SPOTIFY_REFRESH_TOKEN secret.`)
  }
  return data // { access_token, expires_in, scope, token_type, refresh_token? }
}

// Exchange an authorization code for tokens (used once, by the auth script).
export async function exchangeCode({ clientId, clientSecret, code, redirectUri }) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuth(clientId, clientSecret),
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Code exchange failed: ${data.error || res.status}`)
  return data
}

// GET an API endpoint. Returns parsed JSON, or null for HTTP 204 (no content).
export async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 204) return null
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GET ${path} -> ${res.status} ${body.slice(0, 200)}`)
  }
  return res.json()
}

export const SCOPES = ['user-top-read', 'user-read-recently-played', 'user-read-currently-playing']
