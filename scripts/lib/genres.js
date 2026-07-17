// Weight genres from a ranked list of top artists. Each artist contributes
// (51 - rank) to every genre it lists, so higher-ranked artists count for more.
// Returns the top `limit` genres as { genre, weight } where weight is a fraction
// of the total that sums to <= 1 across the returned set.
// Note: Spotify strips genres from the API for development-mode apps, so this
// usually returns empty in practice; kept for if genres become available.
export function weightGenres(artists, limit = 12) {
  const totals = new Map()
  for (const a of artists || []) {
    const rank = a.rank || 51
    const w = Math.max(1, 51 - rank)
    for (const g of a.genres || []) {
      totals.set(g, (totals.get(g) || 0) + w)
    }
  }
  const sum = [...totals.values()].reduce((s, v) => s + v, 0)
  if (!sum) return []
  return [...totals.entries()]
    .map(([genre, v]) => ({ genre, weight: v / sum }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
}
