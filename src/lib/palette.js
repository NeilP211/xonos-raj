// Restrained mono + green ramp for the terminal/brutalist theme. Each
// fallback thumbnail gets a stable, on-brand shade by index (no rainbow).
export const PALETTE = [
  '#2fed6f', // green
  '#2b2b2b', // graphite
  '#5bc47f', // dim green
  '#3a3a3a', // slate
  '#a9ffc6', // light green
  '#1f1f1f', // near-black
  '#1a8f3f', // dark green
  '#4a4a4a', // ash
]

export function colorFor(index) {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length]
}

// Deterministic color from a string key (used for genres so the same genre keeps
// its color across ranges).
export function colorForKey(key) {
  let h = 0
  for (let i = 0; i < (key?.length ?? 0); i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return colorFor(Math.abs(h))
}
