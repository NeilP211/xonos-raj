import { useEffect, useMemo, useState } from 'react'
import { loadJSON } from './lib/data'
import { timeAgo } from './lib/format'
import { playsInRange, monthRange } from './lib/stats'
import RangeToggle from './components/RangeToggle'
import TimeScope from './components/TimeScope'
import TrackOfWeek from './components/TrackOfWeek'
import TopTracks from './components/TopTracks'
import TopArtists from './components/TopArtists'
import ListeningPulse from './components/ListeningPulse'
import RecentlyPlayed from './components/RecentlyPlayed'
import FunStats from './components/FunStats'
import NewDiscoveries from './components/NewDiscoveries'

// Slice the plays log to the selected activity scope ('all' or 'YYYY-M').
function scopePlays(plays, scope) {
  if (!scope || scope === 'all') return plays
  const [y, m] = scope.split('-').map(Number)
  const [start, end] = monthRange(y, m)
  return playsInRange(plays, start, end)
}

export default function App() {
  const [top, setTop] = useState(null)
  const [recent, setRecent] = useState(null)
  const [range, setRange] = useState('short_term')
  const [scope, setScope] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([loadJSON('top.json'), loadJSON('recent.json')]).then(([t, r]) => {
      if (!alive) return
      setTop(t)
      setRecent(r)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  const allPlays = recent?.plays || []
  const scopedRecent = useMemo(
    () => (recent ? { ...recent, plays: scopePlays(allPlays, scope) } : recent),
    [recent, allPlays, scope]
  )

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading Xonos-Raj...</div>
      </div>
    )
  }

  const isSample = !!top?._note
  const rangeData = top?.ranges?.[range]

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          Xonos-Raj
        </div>
        <RangeToggle value={range} onChange={setRange} />
        <TimeScope plays={allPlays} value={scope} onChange={setScope} />
        <div className="spacer" />
        {top?.generated_at && <div className="updated">updated {timeAgo(top.generated_at)}</div>}
      </header>

      {isSample && (
        <div className="sample-banner">
          Showing placeholder sample data. Wire up your Spotify credentials (see README) and the first
          fetch replaces this with your real listening.
        </div>
      )}

      <div className="grid">
        <TrackOfWeek recent={recent} />
        <TopTracks tracks={rangeData?.tracks} />
        <TopArtists artists={rangeData?.artists} />
        <RecentlyPlayed recent={scopedRecent} />
        <ListeningPulse recent={scopedRecent} />
        <FunStats top={top} range={range} recent={scopedRecent} />
        <NewDiscoveries top={top} />
      </div>

      <div className="footnote">
        Xonos-Raj · built with the Spotify Web API · data updates automatically
      </div>
    </div>
  )
}
