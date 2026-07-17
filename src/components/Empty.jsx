export default function Empty({ text = 'No data yet' }) {
  return <div style={{ color: 'var(--muted-2)', fontSize: 13, padding: '12px 6px' }}>{text}</div>
}
