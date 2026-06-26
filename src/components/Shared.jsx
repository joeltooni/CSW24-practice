import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { scrabbleValues } from '../lib/quiz.js'

// Stat number that counts up smoothly whenever its value changes.
export function AnimatedNumber({ value, suffix = '' }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => `${Math.round(latest)}${suffix}`)

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.7, ease: 'easeOut' })
    return controls.stop
  }, [value, count])

  return <motion.span>{rounded}</motion.span>
}

export function StatCard({ variant, label, value, suffix = '', icon: Icon, delay = 0 }) {
  return (
    <motion.div
      className={`stat-card ${variant}`}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className="glow" />
      <div className="stat-top">
        <span className="label">{label}</span>
        {Icon && (
          <span className="stat-icon">
            <Icon size={16} strokeWidth={2.4} />
          </span>
        )}
      </div>
      <div className="value">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
    </motion.div>
  )
}

// A single Scrabble tile. A "_" renders as an empty slot.
function Tile({ ch, small }) {
  const isBlank = ch === '_' || ch === ' '
  const pts = scrabbleValues[ch?.toUpperCase()] ?? 0
  return (
    <motion.span
      className={`tile ${small ? 'small' : ''} ${isBlank ? 'blank' : ''}`}
      variants={{
        hidden: { opacity: 0, y: 22, rotateX: -90 },
        visible: { opacity: 1, y: 0, rotateX: 0 },
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      {isBlank ? '' : ch}
      {!isBlank && pts > 0 && <span className="pts">{pts}</span>}
    </motion.span>
  )
}

// Word rendered as Scrabble tiles, each springing in with a stagger.
export function AnimatedWord({ text, small = false }) {
  const str = String(text ?? '')
  return (
    <motion.div
      className="word-display"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      key={str}
    >
      {str.split('').map((ch, i) => (
        <Tile key={`${ch}-${i}`} ch={ch} small={small} />
      ))}
    </motion.div>
  )
}

const CONFETTI_COLORS = ['#fbc23d', '#ff5c39', '#46b6a4', '#3ec46f', '#4f86f7', '#8b7bf0']

// Lightweight confetti burst — no dependency, just animated divs.
export function Confetti({ count = 90 }) {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const duration = 2.5 + Math.random() * 2
        const delay = Math.random() * 0.6
        const drift = (Math.random() - 0.5) * 180
        return (
          <motion.div
            key={i}
            className="confetti-piece"
            style={{ left: `${left}%`, background: color }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: '105vh', x: drift, rotate: 540, opacity: [1, 1, 0] }}
            transition={{ duration, delay, ease: 'easeIn' }}
          />
        )
      })}
    </div>
  )
}
