import { motion } from 'framer-motion'
import {
  BarChart3,
  CheckCircle2,
  Target,
  Coins,
  Gauge,
  PartyPopper,
  ThumbsUp,
  BookOpen,
  Home,
  RotateCcw,
} from 'lucide-react'
import { StatCard, Confetti } from './Shared.jsx'

export default function ResultsScreen({ quizStats, total, onMenu, onRetry }) {
  const correct = quizStats.correct
  const accuracy = Math.round((correct / total) * 100)
  const avg = Math.round(quizStats.score / total)

  const headline =
    accuracy >= 80
      ? { icon: PartyPopper, text: 'Excellent!', color: 'var(--success)' }
      : accuracy >= 60
        ? { icon: ThumbsUp, text: 'Good Job!', color: 'var(--info)' }
        : { icon: BookOpen, text: 'Keep Practicing!', color: 'var(--warning)' }
  const HeadIcon = headline.icon

  return (
    <div className="container">
      {accuracy >= 80 && <Confetti />}

      <motion.div className="header" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="brand">
          <span className="brand-mark">
            <BarChart3 size={22} />
          </span>
          <h1>Quiz Results</h1>
        </div>
      </motion.div>

      <div className="stats-grid">
        <StatCard variant="success" icon={CheckCircle2} label="Correct" value={correct} delay={0.1} />
        <StatCard variant="warning" icon={Target} label="Accuracy" value={accuracy} suffix="%" delay={0.2} />
        <StatCard variant="accent" icon={Coins} label="Score" value={quizStats.score} delay={0.3} />
        <StatCard variant="info" icon={Gauge} label="Avg/Q" value={avg} delay={0.4} />
      </div>

      <motion.div
        className="card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45, type: 'spring', stiffness: 220, damping: 20 }}
      >
        <motion.div
          className="results-headline"
          style={{ color: headline.color }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.55, type: 'spring', stiffness: 300, damping: 14 }}
        >
          <HeadIcon size={28} /> {headline.text}
        </motion.div>
        <p style={{ marginTop: '14px', fontSize: '16px', color: 'var(--muted)' }}>
          You got <strong style={{ color: 'var(--text)' }}>{correct}</strong> out of{' '}
          <strong style={{ color: 'var(--text)' }}>{total}</strong> questions correct.
        </p>
        <div className="navigation">
          <motion.button onClick={onMenu} whileTap={{ scale: 0.95 }}>
            <Home size={17} /> Menu
          </motion.button>
          <motion.button className="primary" onClick={onRetry} whileTap={{ scale: 0.95 }}>
            <RotateCcw size={17} /> Try Again
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
