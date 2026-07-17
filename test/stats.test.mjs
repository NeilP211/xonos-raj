import { test } from 'node:test'
import assert from 'node:assert/strict'
import { playsInRange, monthsWithData, monthRange, topTrackByPlays, cellPlays } from '../src/lib/stats.js'

// Use explicit local-time constructs so the test is timezone-independent.
function at(y, mo, d, h) {
  return { played_at: new Date(y, mo, d, h, 0, 0).toISOString(), name: `t${h}`, artists: ['A'], uri: `u${y}${mo}${d}${h}` }
}

const PLAYS = [
  at(2026, 5, 3, 9), // Jun
  at(2026, 5, 3, 9), // Jun, same hour
  at(2026, 5, 20, 14), // Jun
  at(2026, 4, 15, 22), // May
]

test('playsInRange filters by epoch bounds, end-exclusive', () => {
  const [s, e] = monthRange(2026, 5)
  const jun = playsInRange(PLAYS, s, e)
  assert.equal(jun.length, 3)
  assert.equal(playsInRange(PLAYS, null, null).length, 4)
})

test('monthsWithData groups and sorts newest first', () => {
  const m = monthsWithData(PLAYS)
  assert.equal(m.length, 2)
  assert.deepEqual([m[0].year, m[0].month, m[0].count], [2026, 5, 3])
  assert.deepEqual([m[1].year, m[1].month, m[1].count], [2026, 4, 1])
})

test('topTrackByPlays returns the most repeated track', () => {
  const dup = { played_at: new Date(2026, 5, 3, 9).toISOString(), name: 'Hit', artists: ['A'], uri: 'hit' }
  const best = topTrackByPlays([dup, { ...dup }, at(2026, 5, 1, 1)])
  assert.equal(best.count, 2)
  assert.equal(best.play.name, 'Hit')
})

test('cellPlays buckets a weekday+hour and counts duplicates', () => {
  // PLAYS[0] and [1] are both Jun 3 2026 at 09:00 local.
  const dow = new Date(2026, 5, 3, 9).getDay()
  const cell = cellPlays(PLAYS, dow, 9)
  assert.equal(cell.length, 1)
  assert.equal(cell[0].count, 2)
})

test('ignores unparseable timestamps', () => {
  const bad = [{ played_at: 'nonsense', name: 'x', artists: [] }]
  assert.equal(playsInRange(bad, null, null).length, 0)
  assert.equal(monthsWithData(bad).length, 0)
})
