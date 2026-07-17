// One-time local script: authorize once and print a long-lived refresh token.
// Usage:
//   SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... npm run auth
// (or put them in a local .env file, which is gitignored)
//
// Register this redirect URI in your Spotify app dashboard first:
//   http://127.0.0.1:8888/callback
import http from 'node:http'
import { exec } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { exchangeCode, SCOPES } from './lib/spotify.js'

function loadDotEnv() {
  try {
    const txt = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* no .env, fine */
  }
}

loadDotEnv()

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8888/callback'

if (!clientId || !clientSecret) {
  console.error('Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET (env or .env file).')
  process.exit(1)
}

const state = crypto.randomBytes(8).toString('hex')
const authUrl =
  'https://accounts.spotify.com/authorize?' +
  new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES.join(' '),
    redirect_uri: redirectUri,
    state,
  }).toString()

const port = Number(new URL(redirectUri).port || 8888)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri)
  if (url.pathname !== '/callback') {
    res.writeHead(404).end()
    return
  }
  const code = url.searchParams.get('code')
  const gotState = url.searchParams.get('state')
  if (!code || gotState !== state) {
    res.writeHead(400, { 'Content-Type': 'text/html' }).end('<h1>Auth failed</h1><p>Missing code or state mismatch.</p>')
    return
  }
  try {
    const tokens = await exchangeCode({ clientId, clientSecret, code, redirectUri })
    // Write the token to a gitignored file so it can be piped straight into a
    // GitHub secret without printing it to a shared terminal.
    fs.writeFileSync(new URL('../.refresh_token', import.meta.url), tokens.refresh_token)
    res.writeHead(200, { 'Content-Type': 'text/html' }).end('<h1>Xonos-Raj authorized</h1><p>You can close this tab and return to the terminal.</p>')
    console.log('\nAuthorized. Refresh token written to .refresh_token (gitignored).')
    console.log('Scopes granted:', tokens.scope)
    server.close()
    process.exit(0)
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/html' }).end(`<h1>Token exchange failed</h1><pre>${e.message}</pre>`)
    console.error(e.message)
    server.close()
    process.exit(1)
  }
})

server.listen(port, () => {
  console.log('Listening for the Spotify redirect on', redirectUri)
  console.log('\nIf your browser does not open, paste this URL:\n')
  console.log(authUrl, '\n')
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open'
  exec(`${opener} "${authUrl}"`, () => {})
})
