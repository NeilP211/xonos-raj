// Local, offline script: turn a downloaded Spotify "Extended streaming history"
// export into the publishable all-time summary (public/data/alltime.json).
// Usage:
//   npm run ingest -- /path/to/unzipped/Spotify_Extended_Streaming_History
// Accepts a folder (searched recursively) or a single JSON file. Unzip the
// export first; .zip files are not read directly.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { aggregateHistory } from './lib/aggregate.js'

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/data')

function isHistoryFile(name) {
  return /\.json$/i.test(name) && (/streaming_history_audio/i.test(name) || /^endsong/i.test(name))
}

function collectFiles(target) {
  const stat = fs.statSync(target)
  if (stat.isFile()) return [target]
  const out = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (isHistoryFile(entry.name)) out.push(full)
    }
  }
  walk(target)
  return out
}

function main() {
  const target = process.argv[2]
  if (!target) {
    console.error('Usage: npm run ingest -- /path/to/unzipped/export')
    process.exit(1)
  }
  if (!fs.existsSync(target)) {
    console.error('Path not found:', target)
    process.exit(1)
  }
  if (/\.zip$/i.test(target)) {
    console.error('Please unzip the export first, then point this at the unzipped folder.')
    process.exit(1)
  }

  const files = collectFiles(target)
  if (!files.length) {
    console.error('No Streaming_History_Audio_*.json or endsong_*.json files found under', target)
    process.exit(1)
  }
  console.log(`Reading ${files.length} history file(s)...`)

  const rows = []
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'))
      if (Array.isArray(data)) rows.push(...data)
    } catch (e) {
      console.warn('Skipping unreadable file', f, e.message)
    }
  }
  console.log(`Parsed ${rows.length} stream rows.`)

  const summary = aggregateHistory(rows)
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, 'alltime.json'), JSON.stringify(summary, null, 2) + '\n')

  const t = summary.totals
  console.log('\nWrote public/data/alltime.json')
  console.log(`  since ${summary.since}, ${t.streams.toLocaleString()} streams, ${t.hours.toLocaleString()} hours`)
  console.log(`  ${t.distinct_tracks.toLocaleString()} tracks, ${t.distinct_artists.toLocaleString()} artists`)
  console.log('\nCommit and push to publish your lifetime stats.')
}

main()
