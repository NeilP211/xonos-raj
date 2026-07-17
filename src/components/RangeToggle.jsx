import { RANGES } from '../lib/data'

export default function RangeToggle({ value, onChange }) {
  return (
    <div className="toggle" role="tablist" aria-label="Time range">
      {RANGES.map((r) => (
        <button
          key={r.key}
          role="tab"
          aria-selected={value === r.key}
          className={value === r.key ? 'active' : ''}
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
