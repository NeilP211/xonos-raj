import Thumb from './Thumb'
import Empty from './Empty'
import { playsInRange, topTrackByPlays } from '../lib/stats'

// Most-played track over the rolling last 7 days. Independent of the time-scope
// selector by design - "of the week" is always the trailing week.
export default function TrackOfWeek({ recent }) {
  const all = recent?.plays || []
  const weekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000
  const week = playsInRange(all, weekAgo, null)
  const best = topTrackByPlays(week)

  return (
    <div className="card col-12 totw">
      <h2>Track of the Week</h2>
      {!best ? (
        <Empty text="Once you have a week of plays logged, your most-played track lands here." />
      ) : (
        <div className="totw-body">
          <Thumb name={best.play.album || best.play.name} image={best.play.image} />
          <div className="totw-meta">
            <div className="totw-name">{best.play.name}</div>
            <div className="totw-artist">{(best.play.artists || []).join(', ')}</div>
            <div className="totw-count">
              {best.count} play{best.count === 1 ? '' : 's'} in the last 7 days
            </div>
          </div>
          {best.play.uri && (
            <a
              className="totw-link"
              href={best.play.uri.replace('spotify:track:', 'https://open.spotify.com/track/')}
              target="_blank"
              rel="noreferrer"
            >
              Open in Spotify
            </a>
          )}
        </div>
      )}
    </div>
  )
}
