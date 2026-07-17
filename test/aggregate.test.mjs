import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateHistory } from '../scripts/lib/aggregate.js'

const ROWS = [
  { ts: '2023-01-01T08:30:00Z', ms_played: 180000, master_metadata_track_name: 'A', master_metadata_album_artist_name: 'X', master_metadata_album_album_name: 'Alb1', reason_end: 'trackdone', shuffle: false, skipped: false },
  { ts: '2023-01-01T09:00:00Z', ms_played: 60000, master_metadata_track_name: 'A', master_metadata_album_artist_name: 'X', master_metadata_album_album_name: 'Alb1', reason_end: 'fwdbtn', shuffle: true, skipped: true },
  { ts: '2024-06-15T22:15:00Z', ms_played: 240000, master_metadata_track_name: 'B', master_metadata_album_artist_name: 'Y', master_metadata_album_album_name: 'Alb2', reason_end: 'trackdone', shuffle: false, skipped: false },
  { ts: '2024-06-15T23:00:00Z', ms_played: 0, episode_name: 'Pod', master_metadata_track_name: null },
]

test('filters non-music rows and totals correctly', () => {
  const s = aggregateHistory(ROWS)
  assert.equal(s.totals.streams, 3) // podcast row dropped
  assert.equal(s.totals.minutes, 8) // 480000 ms
  assert.equal(s.totals.distinct_tracks, 2)
  assert.equal(s.totals.distinct_artists, 2)
})

test('top tracks aggregate plays and minutes per track', () => {
  const s = aggregateHistory(ROWS)
  const byPlays = s.top_tracks_by_plays
  assert.equal(byPlays[0].name, 'A')
  assert.equal(byPlays[0].plays, 2)
  assert.equal(byPlays[0].minutes, 4) // 240000 ms
})

test('behavior rates and reason_end histogram', () => {
  const s = aggregateHistory(ROWS)
  assert.ok(Math.abs(s.behavior.skip_rate - 1 / 3) < 1e-9)
  assert.ok(Math.abs(s.behavior.shuffle_rate - 1 / 3) < 1e-9)
  assert.equal(s.behavior.reason_end.trackdone, 2)
  assert.equal(s.behavior.reason_end.fwdbtn, 1)
})

test('by_year, firsts, since, and heatmap shape', () => {
  const s = aggregateHistory(ROWS)
  assert.deepEqual(s.by_year.map((y) => y.year), [2023, 2024])
  assert.equal(s.firsts.first_stream.name, 'A')
  assert.equal(s.since, '2023-01-01')
  assert.equal(s.heatmap.length, 168) // 7 x 24
})

test('empty input does not throw', () => {
  const s = aggregateHistory([])
  assert.equal(s.totals.streams, 0)
  assert.equal(s.since, null)
  assert.equal(s.firsts, null)
})
