import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { StatCard } from './Shared.jsx'

const LENGTHS = [
  { id: 'mix', label: 'All' },
  { id: '2', label: '2-Letter' },
  { id: '3', label: '3-Letter' },
  { id: '4', label: '4-Letter' },
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
  onStudy,
  onQuiz,
}) {
  const total = wordData.words.length
  const progressPct = Math.round((masteredCount / total) * 100)

  return (
    <div className="container">
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

      <div className="stats-grid">
        <StatCard variant="info" icon={Library} label="Words" value={total} delay={0.05} />
        <StatCard variant="success" icon={CheckCircle2} label="Mastered" value={masteredCount} delay={0.1} />
        <StatCard variant="warning" icon={AlertTriangle} label="Practice" value={needsPracticeCount} delay={0.15} />
        <StatCard variant="accent" icon={TrendingUp} label="Progress" value={progressPct} suffix="%" delay={0.2} />
      </div>

      <div className="progress-shell">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <span className="progress-pct">{progressPct}%</span>
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
            {LENGTHS.map(({ id, label }) => (
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
          <input
            type="number"
            value={sessionQuestions}
            onChange={(e) => setSessionQuestions(Math.max(1, parseInt(e.target.value, 10) || 15))}
            min="1"
            max="100"
          />
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
    </div>
  )
}
