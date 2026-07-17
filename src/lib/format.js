// Small formatting helpers. No external date library needed.

export function commas(n) {
  if (n == null || Number.isNaN(n)) return '0'
  return Math.round(n).toLocaleString('en-US')
}

export function minutesToHuman(minutes) {
  if (!minutes) return '0 min'
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${commas(days)}d ${hours}h`
  if (hours > 0) return `${hours}h ${Math.round(minutes % 60)}m`
  return `${Math.round(minutes)} min`
}

export function timeAgo(iso, nowMs) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const ref = nowMs ?? new Date().getTime()
  const sec = Math.max(0, Math.round((ref - then) / 1000))
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.round(hr / 24)
  return `${d}d ago`
}

export function clockTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
