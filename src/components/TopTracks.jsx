import Thumb from './Thumb'
import Empty from './Empty'

export default function TopTracks({ tracks }) {
  const list = tracks || []
  return (
    <div className="card col-4">
      <h2>Top Tracks</h2>
      <div className="ranklist">
        {list.map((t) => (
          <div className="rankrow" key={`${t.rank}-${t.name}`}>
            <div className="rank">{t.rank}</div>
            <Thumb name={t.album || t.name} image={t.image} />
            <div className="meta">
              <div className="name">{t.name}</div>
              <div className="sub">{(t.artists || []).join(', ')}</div>
            </div>
          </div>
        ))}
        {!list.length && <Empty />}
      </div>
    </div>
  )
}
