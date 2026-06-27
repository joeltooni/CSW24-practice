import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, CheckCircle2, Coins } from 'lucide-react'
import { matchesLength } from '../lib/quiz.js'

// Shows mastered words broken down by category, with a tap-to-filter list.
export default function MasteredScreen({ words, progress, categories, onExit }) {
  const [filter, setFilter] = useState('all')

  const mastered = useMemo(
    () => words.filter((w) => progress[w.word] === 'mastered'),
    [words, progress],
  )

  // Count per category (a word can belong to several, so counts may overlap).
  const counts = useMemo(() => {
    const m = { all: mastered.length }
    for (const c of categories) m[c.id] = mastered.filter((w) => matchesLength(w, c.id)).length
    return m
  }, [mastered, categories])

  // Breakdown chips: "All" plus every category that has at least one mastered word.
  const chips = [{ id: 'all', label: 'All' }, ...categories.filter((c) => counts[c.id] > 0)]

  const list = useMemo(() => {
    const filtered = filter === 'all' ? mastered : mastered.filter((w) => matchesLength(w, filter))
    return [...filtered].sort((a, b) => a.word.localeCompare(b.word))
  }, [mastered, filter])

  return (
    <div className="container">
      <div className="study-nav">
        <button onClick={onExit}>
          <ChevronLeft size={16} /> Menu
        </button>
        <span>{mastered.length} mastered</span>
        <span style={{ width: 64 }} />
      </div>

      {mastered.length === 0 ? (
        <div className="card">
          <CheckCircle2 size={36} color="var(--green-deep)" style={{ marginBottom: 10 }} />
          <h2>No mastered words yet</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8 }}>
            Mark words as <strong>Learned</strong> in Study mode and they'll show up here, grouped by
            category.
          </p>
        </div>
      ) : (
        <>
          <div className="cat-breakdown">
            {chips.map((c) => (
              <button
                key={c.id}
                className={`cat-chip ${filter === c.id ? 'active' : ''}`}
                onClick={() => setFilter(c.id)}
              >
                {c.label} <span className="cat-count">{counts[c.id]}</span>
              </button>
            ))}
          </div>

          <div className="search-results">
            {list.map((w, i) => (
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
                  <CheckCircle2 size={16} color="var(--green-deep)" />
                </div>
                <div className="result-def">{w.definition}</div>
                {w.group && <span className="result-group">{w.group}</span>}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
