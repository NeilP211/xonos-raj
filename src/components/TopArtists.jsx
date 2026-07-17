import Thumb from './Thumb'
import Empty from './Empty'

// Scrollable ranked list so the rank of each artist is clear at a glance.
export default function TopArtists({ artists }) {
  const list = artists || []
  return (
    <div className="card col-4">
      <h2>Top Artists</h2>
      <div className="ranklist">
        {list.map((a) => (
          <div className="rankrow" key={`${a.rank}-${a.name}`}>
            <div className="rank">{a.rank}</div>
            <Thumb name={a.name} image={a.image} round />
            <div className="meta">
              <div className="name">{a.name}</div>
            </div>
          </div>
        ))}
        {!list.length && <Empty />}
      </div>
    </div>
  )
}
