// Scheduled (CI) script: refresh the access token, pull the live data, and write
// the public JSON files. Reads credentials from env / CI secrets:
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { refreshAccessToken, apiGet } from './lib/spotify.js'
import { weightGenres } from './lib/genres.js'

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/data')
const RANGES = ['short_term', 'medium_term', 'long_term']
const MAX_RECENT = 2000

function loadDotEnv() {
  try {
    const txt = fs.readFileSync(path.resolve(DATA_DIR, '../../.env'), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* no .env, fine */
  }
}

function readJSON(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'))
  } catch {
    return fallback
  }
}

function writeJSON(name, obj) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(obj, null, 2) + '\n')
  console.log('wrote', name)
}

function image(images) {
  return images && images.length ? images[0].url : null
}

function shapeTrack(t, rank) {
  return {
    rank,
    name: t.name,
    artists: (t.artists || []).map((a) => a.name),
    album: t.album?.name || '',
    image: image(t.album?.images),
    uri: t.uri || '',
    url: t.external_urls?.spotify || '',
    duration_ms: t.duration_ms || 0,
  }
}

function shapeArtist(a, rank) {
  return {
    rank,
    name: a.name,
    image: image(a.images),
    genres: a.genres || [],
    uri: a.uri || '',
    url: a.external_urls?.spotify || '',
  }
}

function shapePlay(item) {
  const t = item.track || {}
  return {
    played_at: item.played_at,
    name: t.name,
    artists: (t.artists || []).map((a) => a.name),
    album: t.album?.name || '',
    image: image(t.album?.images),
    uri: t.uri || '',
    duration_ms: t.duration_ms || 0,
  }
}

async function buildTop(token) {
  const ranges = {}
  const genres = {}
  for (const range of RANGES) {
    const [tracks, artists] = await Promise.all([
      apiGet(`/me/top/tracks?time_range=${range}&limit=50`, token),
      apiGet(`/me/top/artists?time_range=${range}&limit=50`, token),
    ])
    const shapedArtists = (artists?.items || []).map((a, i) => shapeArtist(a, i + 1))
    const shapedTracks = (tracks?.items || []).map((t, i) => shapeTrack(t, i + 1))
    ranges[range] = { tracks: shapedTracks, artists: shapedArtists }
    // Genres are stripped for development-mode apps, so this is usually empty.
    genres[range] = weightGenres(shapedArtists)
  }
  return { generated_at: new Date().toISOString(), ranges, genres }
}

async function buildRecent(token) {
  const prev = readJSON('recent.json', { plays: [] })
  // If the file is still the placeholder sample (top-level _note), start fresh so
  // dummy plays do not mix into real history on the first authenticated fetch.
  const prevPlays = prev._note ? [] : (prev.plays || []).filter((p) => p.played_at)
  const newest = prevPlays.reduce((max, p) => Math.max(max, new Date(p.played_at).getTime()), 0)
  const afterParam = newest ? `&after=${newest}` : ''
  const recent = await apiGet(`/me/player/recently-played?limit=50${afterParam}`, token)
  const fresh = (recent?.items || []).map(shapePlay)

  const byTime = new Map()
  for (const p of [...prevPlays, ...fresh]) byTime.set(p.played_at, p)
  const plays = [...byTime.values()]
    .sort((a, b) => new Date(a.played_at) - new Date(b.played_at))
    .slice(-MAX_RECENT)

  return { updated_at: new Date().toISOString(), plays }
}

async function buildNow(token, recent) {
  const current = await apiGet('/me/player/currently-playing', token)
  if (current && current.item) {
    const t = current.item
    return {
      updated_at: new Date().toISOString(),
      is_playing: !!current.is_playing,
      track: { name: t.name, artists: (t.artists || []).map((a) => a.name), album: t.album?.name || '', image: image(t.album?.images), uri: t.uri || '' },
      played_at: new Date().toISOString(),
    }
  }
  // Nothing playing (HTTP 204): fall back to the most recent play as "last spun".
  const last = recent.plays[recent.plays.length - 1]
  return {
    updated_at: new Date().toISOString(),
    is_playing: false,
    track: last ? { name: last.name, artists: last.artists, album: last.album, image: last.image, uri: last.uri } : null,
    played_at: last ? last.played_at : null,
  }
}

async function main() {
  loadDotEnv()
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN.')
    process.exit(1)
  }

  const tokens = await refreshAccessToken({ clientId, clientSecret, refreshToken })
  if (tokens.refresh_token && tokens.refresh_token !== refreshToken) {
    console.warn('NOTE: Spotify returned a NEW refresh token. Update the SPOTIFY_REFRESH_TOKEN secret with it to avoid future failures.')
  }
  const token = tokens.access_token

  const top = await buildTop(token)
  writeJSON('top.json', top)

  const recent = await buildRecent(token)
  writeJSON('recent.json', recent)

  const now = await buildNow(token, recent)
  writeJSON('now.json', now)

  console.log('Done.')
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
