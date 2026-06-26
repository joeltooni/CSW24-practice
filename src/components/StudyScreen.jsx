import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
} from 'lucide-react'
import { AnimatedWord } from './Shared.jsx'

export default function StudyScreen({
  studyWords,
  studyIndex,
  setStudyIndex,
  progress,
  onSeen,
  onMarkLearned,
  onExit,
}) {
  const word = studyWords[studyIndex]

  const goPrev = () => setStudyIndex(Math.max(0, studyIndex - 1))
  const goNext = () => setStudyIndex(Math.min(studyWords.length - 1, studyIndex + 1))

  // Arrow keys flip through cards.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [studyIndex, studyWords.length])

  // Record each word as "seen" the moment it's shown.
  useEffect(() => {
    if (word) onSeen(word.word)
  }, [word?.word]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!word) {
    return (
      <div className="container">
        <motion.div className="card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle2 size={40} color="var(--success)" style={{ margin: '0 auto 12px' }} />
          <h2>Study Complete!</h2>
          <p style={{ marginTop: '12px', color: 'var(--muted)' }}>You've reviewed all available words.</p>
          <button className="primary" style={{ marginTop: '18px' }} onClick={onExit}>
            <ChevronLeft size={18} /> Back to Menu
          </button>
        </motion.div>
      </div>
    )
  }

  const status = progress[word.word]

  return (
    <div className="container">
      <div className="study-nav">
        <button onClick={onExit}>
          <ChevronLeft size={16} /> Menu
        </button>
        <span>
          {studyIndex + 1} / {studyWords.length}
        </span>
        <button onClick={goNext} disabled={studyIndex >= studyWords.length - 1}>
          Next <ChevronRight size={16} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="card"
          key={word.word}
          initial={{ opacity: 0, x: 60, rotateY: 22 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={{ opacity: 0, x: -60, rotateY: -22 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          style={{ transformPerspective: 1000 }}
        >
          <AnimatedWord text={word.word} />
          <motion.div
            className="word-points"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Coins size={17} /> {word.points} points
          </motion.div>
          <div>
            <span className="word-group">{word.group}</span>
          </div>
          {word.rarity === 'rare' && (
            <div>
              <span className="word-rarity">
                <Star size={13} fill="currentColor" /> Rare High-Scorer
              </span>
            </div>
          )}
          <div className="word-definition">{word.definition}</div>
          <div className="word-example">"{word.exampleSentence}"</div>

          <div>
            {status === 'mastered' && (
              <span className="badge mastered">
                <CheckCircle2 size={13} /> Mastered
              </span>
            )}
            {status === 'needs-practice' && (
              <span className="badge needs-practice">
                <AlertTriangle size={13} /> Needs Practice
              </span>
            )}
            {(status === 'seen' || !status) && (
              <span className="badge new">
                <Eye size={13} /> Seen
              </span>
            )}
          </div>

          <div className="navigation">
            <button onClick={goPrev} disabled={studyIndex === 0}>
              <ChevronLeft size={16} /> Prev
            </button>
            <motion.button className="success" onClick={onMarkLearned} whileTap={{ scale: 0.94 }}>
              <Check size={18} /> Learned
            </motion.button>
            <button onClick={goNext} disabled={studyIndex >= studyWords.length - 1}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
