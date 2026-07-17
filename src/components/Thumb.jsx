import { colorForKey } from '../lib/palette'
import { initials } from '../lib/format'

// Album/artist art with a colored initials fallback when no image is available.
export default function Thumb({ name, image, round = false }) {
  const cls = `thumb ${round ? 'round' : ''}`
  if (image) {
    return (
      <div className={cls}>
        <img src={image} alt={name || ''} loading="lazy" />
      </div>
    )
  }
  const c = colorForKey(name || '?')
  // Flat fill (no gradient) to match the brutalist theme; pick readable initials.
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  const light = (r * 299 + g * 587 + b * 114) / 1000 > 130
  return (
    <div className={cls} style={{ background: c, color: light ? '#000' : '#e8e8e8' }}>
      {initials(name)}
    </div>
  )
}
