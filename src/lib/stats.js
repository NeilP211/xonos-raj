// Pure helpers over the recent plays log (recent.json -> plays[]). All bucketing
// uses the viewer's local time zone, consistent with the Listening Pulse heatmap.

function trackKey(p) {
  return p.uri || `${p.name}|${(p.artists || []).join(',')}`
}

// Filter plays to [start, end) in ms epoch. null bound = open on that side.
export function playsInRange(plays, start, end) {
  return (plays || []).filter((p) => {
    const t = new Date(p.played_at).getTime()
    if (Number.isNaN(t)) return false
    if (start != null && t < start) return false
    if (end != null && t >= end) return false
    return true
  })
}

// Months that actually contain plays, newest first: [{ year, month(0-11), count }].
export function monthsWithData(plays) {
  const map = new Map()
  for (const p of plays || []) {
    const d = new Date(p.played_at)
    if (Number.isNaN(d.getTime())) continue
    const key = d.getFullYear() * 12 + d.getMonth()
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()]
    .map(([key, count]) => ({ year: Math.floor(key / 12), month: key % 12, count }))
    .sort((a, b) => b.year - a.year || b.month - a.month)
}

// [start, end) epoch bounds for a given local calendar month.
export function monthRange(year, month) {
  return [new Date(year, month, 1).getTime(), new Date(year, month + 1, 1).getTime()]
}

// Most-played track in the log: { play, count } or null.
export function topTrackByPlays(plays) {
  const map = new Map()
  for (const p of plays || []) {
    const k = trackKey(p)
    const e = map.get(k) || { play: p, count: 0 }
    e.count += 1
    map.set(k, e)
  }
  let best = null
  for (const e of map.values()) if (!best || e.count > best.count) best = e
  return best
}

// Distinct tracks played in a weekday(0=Sun..6=Sat) + hour bucket, counts desc.
export function cellPlays(plays, dow, hour) {
  const map = new Map()
  for (const p of plays || []) {
    const d = new Date(p.played_at)
    if (Number.isNaN(d.getTime())) continue
    if (d.getDay() !== dow || d.getHours() !== hour) continue
    const k = trackKey(p)
    const e = map.get(k) || { name: p.name, artists: p.artists, image: p.image, album: p.album, count: 0 }
    e.count += 1
    map.set(k, e)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}
