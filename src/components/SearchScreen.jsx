import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Search, X, Coins, CheckCircle2, AlertTriangle } from 'lucide-react'

const LIMIT = 80

export default function SearchScreen({ words, progress, onExit }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  // Rank: exact > starts-with > contains > definition match.
  const results = useMemo(() => {
    if (!query) return []
    const qu = query.toUpperCase()
    const scored = []
    for (const w of words) {
      const word = w.word.toUpperCase()
      let rank = -1
      if (word === qu) rank = 0
      else if (word.startsWith(qu)) rank = 1
      else if (word.includes(qu)) rank = 2
      else if (w.definition?.toLowerCase().includes(query)) rank = 3
      if (rank >= 0) scored.push({ w, rank })
    }
    scored.sort((a, b) => a.rank - b.rank || a.w.word.localeCompare(b.w.word))
    return scored.map((s) => s.w)
  }, [query, words])

  const shown = results.slice(0, LIMIT)

  return (
    <div className="container">
      <div className="study-nav">
        <button onClick={onExit}>
          <ChevronLeft size={16} /> Menu
        </button>
        <span>{query ? `${results.length} found` : `${words.length} words`}</span>
        <span style={{ width: 64 }} />
      </div>

      <div className="search-box">
        <Search size={18} className="search-ico" />
        <input
          type="text"
          className="search-field"
          placeholder="Search words or meanings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        {q && (
          <button className="search-clear" onClick={() => setQ('')} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      {!query && <p className="search-hint">Type a word, or part of a meaning, to look it up.</p>}

      {query && results.length === 0 && (
        <div className="card">
          <p style={{ color: 'var(--ink-soft)' }}>No matches for "{q}".</p>
        </div>
      )}

      <div className="search-results">
        {shown.map((w, i) => {
          const status = progress[w.word]
          return (
            <motion.div
              className="result-row"
              key={w.word}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.25) }}
            >
              <div className="result-head">
                <span className="result-word">{w.word}</span>
                <span className="result-points">
                  <Coins size={13} /> {w.points}
                </span>
                {status === 'mastered' && <CheckCircle2 size={16} color="var(--green-deep)" />}
                {status === 'needs-practice' && <AlertTriangle size={16} color="var(--orange)" />}
              </div>
              <div className="result-def">{w.definition}</div>
              {w.group && <span className="result-group">{w.group}</span>}
            </motion.div>
          )
        })}

        {results.length > shown.length && (
          <p className="search-hint">
            Showing first {LIMIT} of {results.length}. Keep typing to narrow it down.
          </p>
        )}
      </div>
    </div>
  )
}
