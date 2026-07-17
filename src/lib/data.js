// Loads the committed JSON data files. Returns null on 404 so the UI can show
// a graceful "not available yet" state (e.g. before the history export exists).
const BASE = import.meta.env.BASE_URL

export async function loadJSON(name) {
  try {
    const res = await fetch(`${BASE}data/${name}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const RANGES = [
  { key: 'short_term', label: '4 Weeks' },
  { key: 'medium_term', label: '6 Months' },
  { key: 'long_term', label: '1 Year' },
]
