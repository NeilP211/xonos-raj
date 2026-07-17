import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { DOW } from '../lib/format'
import { cellPlays } from '../lib/stats'
import Thumb from './Thumb'
import Empty from './Empty'

// Builds a 7 (weekday) x 24 (hour) play-count matrix and a per-day trend from the
// accumulating recently-played log. Uses the viewer's local time zone.
function buildPulse(plays) {
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0))
  const dayMap = new Map()
  for (const p of plays) {
    const d = new Date(p.played_at)
    if (Number.isNaN(d.getTime())) continue
    grid[d.getDay()][d.getHours()] += 1
    const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1)
  }
  const max = Math.max(1, ...grid.flat())
  const series = [...dayMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ms, count]) => ({
      day: new Date(ms).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      plays: count,
    }))
  return { grid, max, series }
}

function cellColor(count, max) {
  if (!count) return 'var(--bg-2)'
  const a = 0.12 + 0.88 * (count / max)
  return `rgba(255, 171, 195, ${a.toFixed(3)})`
}

// Display order: Monday-first (real day indices into the Sunday-based grid).
const ROW_ORDER = [1, 2, 3, 4, 5, 6, 0]

function hourLabel(h) {
  const ampm = h % 12 === 0 ? 12 : h % 12
  return `${ampm}${h < 12 ? 'a' : 'p'}`
}

export default function ListeningPulse({ recent }) {
  const plays = recent?.plays || []
  const [sel, setSel] = useState(null) // { dow, hour } of the clicked cell

  useEffect(() => {
    if (!sel) return
    const onKey = (e) => e.key === 'Escape' && setSel(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel])

  if (!plays.length) {
    return (
      <div className="card col-12">
        <h2>Listening Pulse</h2>
        <Empty text="The hour-by-day heatmap fills in as your play history accumulates." />
      </div>
    )
  }

  const { grid, max, series } = buildPulse(plays)
  const drill = sel ? cellPlays(plays, sel.dow, sel.hour) : []

  return (
    <div className="card col-12">
      <h2>Listening Pulse</h2>
      <p className="pulse-note">All-time average · by weekday &amp; hour · your local time · click a cell for tracks</p>
      <div className="heatmap">
        {ROW_ORDER.map((dow) => (
          <Row key={dow} dow={dow} row={grid[dow]} max={max} sel={sel} onPick={setSel} />
        ))}
        <div className="axis">
          <span>12a</span>
          <span>6a</span>
          <span>12p</span>
          <span>6p</span>
          <span>11p</span>
        </div>
      </div>

      {sel && (
        <div className="drill" onClick={(e) => e.target === e.currentTarget && setSel(null)}>
          <div className="drill-head">
            <span>
              {DOW[sel.dow]} · {hourLabel(sel.hour)} to {hourLabel((sel.hour + 1) % 24)}
            </span>
            <button className="drill-x" onClick={() => setSel(null)} aria-label="Close">
              ✕
            </button>
          </div>
          {drill.length ? (
            <div className="drill-list">
              {drill.map((t, i) => (
                <div className="tick" key={i}>
                  <Thumb name={t.album || t.name} image={t.image} />
                  <div className="meta">
                    <div className="name">{t.name}</div>
                    <div className="sub">{(t.artists || []).join(', ')}</div>
                  </div>
                  <span className="when">{t.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="No plays in this slot." />
          )}
        </div>
      )}

      <div style={{ height: 16 }} />
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={series} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#1f1f1f" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#707070', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: '#707070', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={{ background: '#0a0a0a', border: '1px solid #2b2b2b', borderRadius: 0, color: '#e8e8e8' }}
            formatter={(v) => [v, 'plays']}
          />
          <Line type="monotone" dataKey="plays" stroke="#ffabc3" strokeWidth={2} dot={{ r: 2, fill: '#ffabc3' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function Row({ dow, row, max, sel, onPick }) {
  return (
    <>
      <span className="hlabel">{DOW[dow]}</span>
      {row.map((count, hour) => {
        const active = sel && sel.dow === dow && sel.hour === hour
        return (
          <button
            type="button"
            className={`cell${active ? ' cell-active' : ''}`}
            key={hour}
            style={{ background: cellColor(count, max) }}
            title={`${DOW[dow]} ${hour}:00 - ${count} play(s)`}
            onClick={() => onPick({ dow, hour })}
          />
        )
      })}
    </>
  )
}
