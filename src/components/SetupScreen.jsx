import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SpellCheck2,
  Sparkles,
  Library,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Zap,
  SlidersHorizontal,
  Hash,
  RotateCcw,
  Search,
} from 'lucide-react'
import { StatCard } from './Shared.jsx'
import InstallHint from './InstallHint.jsx'

const BASE_LENGTHS = [
  { id: 'mix', label: 'All' },
  { id: '2', label: '2-Letter' },
  { id: '3', label: '3-Letter' },
]

export default function SetupScreen({
  wordData,
  masteredCount,
  needsPracticeCount,
  selectedWordLength,
  setSelectedWordLength,
  sessionQuestions,
  setSessionQuestions,
  availableCount,
  categories = [],
  onStudy,
  onQuiz,
  onReset,
  onSearch,
}) {
  const total = wordData.words.length
  const progressPct = Math.round((masteredCount / total) * 100)
  const [confirmReset, setConfirmReset] = useState(false)

  // Add category chips only when matching words exist in the data.
  const hasLong = wordData.words.some((w) => w.length === 7 || w.length === 8)
  const hasJQXZ = wordData.words.some((w) => /[JQXZ]/.test(w.word.toUpperCase()))
  const hasQnoU = wordData.words.some((w) => /Q(?!U)/i.test(w.word))
  const lengths = [
    ...BASE_LENGTHS,
    ...(hasLong ? [{ id: '7-8', label: '7–8' }] : []),
    ...(hasJQXZ ? [{ id: 'jqxz', label: 'JQXZ' }] : []),
    ...(hasQnoU ? [{ id: 'q-no-u', label: 'Q (no U)' }] : []),
    ...categories, // curated category chips (e.g. Vowels, Dumps)
  ]

  const maxQuestions = Math.min(100, Math.max(1, availableCount))
  const clampQ = (n) => Math.max(1, Math.min(maxQuestions, n))

  const doReset = () => {
    onReset()
    setConfirmReset(false)
  }

  return (
    <div className="container">
      <InstallHint />

      <motion.div
        className="header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <div className="brand">
          <span className="brand-mark">
            <SpellCheck2 size={24} />
          </span>
          <h1>CSW24 Trainer</h1>
        </div>
        <p>
          <Sparkles size={14} /> Master rare &amp; high-scoring words
        </p>
      </motion.div>

      <button className="search-launch" onClick={onSearch}>
        <Search size={18} /> Search words…
      </button>

      <div className="stats-grid">
        <StatCard variant="info" icon={Library} label="Words" value={total} delay={0.05} />
        <StatCard variant="success" icon={CheckCircle2} label="Mastered" value={masteredCount} delay={0.1} />
        <StatCard variant="warning" icon={AlertTriangle} label="Practice" value={needsPracticeCount} delay={0.15} />
        <StatCard variant="accent" icon={TrendingUp} label="Progress" value={progressPct} suffix="%" delay={0.2} />
      </div>

      {/* Progress gauge — fill extends to the percentage, shown inside the bar */}
      <div className="gauge">
        <motion.div
          className="gauge-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <span className="gauge-label">{progressPct}%</span>
        </motion.div>
      </div>

      <motion.div
        className="card session-setup"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2>
          <SlidersHorizontal size={18} /> Session Setup
        </h2>

        <div className="session-input">
          <label>Word Length</label>
          <div className="button-group tight">
            {lengths.map(({ id, label }) => (
              <motion.button
                key={id}
                className={`grow ${selectedWordLength === id ? 'active' : ''}`}
                onClick={() => setSelectedWordLength(id)}
                whileTap={{ scale: 0.94 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="session-input">
          <label>Questions per Session</label>
          <div className="q-row">
            <input
              type="number"
              className="q-number"
              value={sessionQuestions}
              onChange={(e) => setSessionQuestions(clampQ(parseInt(e.target.value, 10) || 1))}
              min="1"
              max={maxQuestions}
            />
            <input
              type="range"
              className="q-slider"
              value={Math.min(sessionQuestions, maxQuestions)}
              onChange={(e) => setSessionQuestions(clampQ(parseInt(e.target.value, 10)))}
              min="1"
              max={maxQuestions}
              aria-label="Questions per session"
            />
          </div>
          <p className="word-count">
            <Hash size={13} /> {availableCount} words available
          </p>
        </div>

        <div className="button-group">
          <motion.button className="grow" onClick={onStudy} whileTap={{ scale: 0.95 }}>
            <BookOpen size={18} /> Study Mode
          </motion.button>
          <motion.button className="grow primary" onClick={onQuiz} whileTap={{ scale: 0.95 }}>
            <Zap size={18} /> Quiz Mode
          </motion.button>
        </div>
      </motion.div>

      {/* Reset progress */}
      <div className="reset-row">
        <AnimatePresence mode="wait">
          {confirmReset ? (
            <motion.div
              key="confirm"
              className="reset-confirm"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <span>Reset all progress?</span>
              <button className="danger" onClick={doReset}>
                <RotateCcw size={15} /> Yes, reset
              </button>
              <button onClick={() => setConfirmReset(false)}>Cancel</button>
            </motion.div>
          ) : (
            <motion.button
              key="reset"
              className="reset-btn"
              onClick={() => setConfirmReset(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.96 }}
            >
              <RotateCcw size={15} /> Reset Progress
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
