import Thumb from './Thumb'
import Empty from './Empty'

// Artists in your 4-week top list that are absent from your 1-year top list:
// who you have freshly gotten into. Each is paired with a track of theirs that
// you currently play (from the 4-week top tracks), when one exists.
function discoveries(top) {
  const recentArtists = top?.ranges?.short_term?.artists || []
  const longNames = new Set((top?.ranges?.long_term?.artists || []).map((a) => (a.name || '').toLowerCase()))
  const recentTracks = top?.ranges?.short_term?.tracks || []
  return recentArtists
    .filter((a) => !longNames.has((a.name || '').toLowerCase()))
    .map((a) => {
      const track = recentTracks.find((t) =>
        (t.artists || []).some((n) => n.toLowerCase() === (a.name || '').toLowerCase())
      )
      return { ...a, track }
    })
}

export default function NewDiscoveries({ top }) {
  const list = discoveries(top)
  return (
    <div className="card col-6">
      <h2>New Discoveries</h2>
      <p className="pulse-note" style={{ margin: '0 0 12px' }}>
        In your 4-week top, not your 1-year top
      </p>
      {list.length ? (
        <div className="disc-list">
          {list.slice(0, 10).map((a, i) => (
            <a
              className="disc-row"
              key={i}
              href={a.url || a.track?.url || '#'}
              target="_blank"
              rel="noreferrer"
            >
              <Thumb name={a.name} image={a.image} round />
              <div className="meta">
                <div className="name">{a.name}</div>
                <div className="sub">{a.track ? `you play: ${a.track.name}` : 'new to your rotation'}</div>
              </div>
              {typeof a.rank === 'number' && <span className="when">#{a.rank}</span>}
            </a>
          ))}
        </div>
      ) : (
        <Empty text="Once your 4-week and 1-year tastes diverge, fresh artists land here." />
      )}
    </div>
  )
}
