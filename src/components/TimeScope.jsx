import { monthsWithData } from '../lib/stats'

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Scope selector for the activity (plays-log) cards. Value is 'all' or 'YYYY-M'.
// Only months that actually contain plays are offered, newest first.
export default function TimeScope({ plays, value, onChange }) {
  const months = monthsWithData(plays)
  return (
    <label className="scope">
      <span className="scope-lbl">Activity</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">All time</option>
        {months.map((m) => (
          <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
            {MONTH[m.month]} {m.year} ({m.count})
          </option>
        ))}
      </select>
    </label>
  )
}
