import { commas, DOW } from '../lib/format'

// Count distinct artists across the window's top tracks (a simple variety metric).
function distinctArtists(tracks) {
  const set = new Set()
  for (const t of tracks || []) for (const a of t.artists || []) set.add(a)
  return set.size
}

// Artists in the 4-week list that are not in the 1-year list: who you are into lately.
function risingArtists(top) {
  const recentNames = (top?.ranges?.short_term?.artists || []).map((a) => a.name)
  const longNames = new Set((top?.ranges?.long_term?.artists || []).map((a) => a.name))
  return recentNames.filter((n) => !longNames.has(n))
}

function busiestHour(plays) {
  const hours = new Array(24).fill(0)
  let any = false
  for (const p of plays || []) {
    const d = new Date(p.played_at)
    if (Number.isNaN(d.getTime())) continue
    hours[d.getHours()] += 1
    any = true
  }
  if (!any) return null
  const h = hours.indexOf(Math.max(...hours))
  const ampm = h % 12 === 0 ? 12 : h % 12
  return `${ampm}${h < 12 ? 'am' : 'pm'}`
}

export default function FunStats({ top, range, recent }) {
  const tracks = top?.ranges?.[range]?.tracks || []
  const artistCount = distinctArtists(tracks)
  const rising = risingArtists(top)
  const plays = recent?.plays || []
  const hour = busiestHour(plays)

  return (
    <div className="card col-6">
      <h2>The Numbers</h2>
      <div className="stats">
        <div className="stat">
          <div className="big grad">{artistCount}</div>
          <div className="lbl">distinct artists in this window</div>
        </div>
        <div className="stat">
          <div className="big grad">{rising.length}</div>
          <div className="lbl">rising artists</div>
        </div>
        <div className="stat">
          <div className="big grad">{commas(plays.length)}</div>
          <div className="lbl">plays logged so far</div>
        </div>
        <div className="stat">
          <div className="big grad">{hour || '--'}</div>
          <div className="lbl">busiest listening hour</div>
        </div>
      </div>
      {rising.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="lbl" style={{ marginBottom: 8, color: 'var(--muted)' }}>On the rise</div>
          <div className="chips">
            {rising.slice(0, 8).map((n) => (
              <span className="chip" key={n}>
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
