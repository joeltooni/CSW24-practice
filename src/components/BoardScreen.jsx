import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid,
  Lightbulb,
  Eye,
  Shuffle,
  Coins,
  Check,
  X,
  LogOut,
  ArrowRight,
  Trophy,
  CircleDot,
} from 'lucide-react'
import { scrabbleValues } from '../lib/quiz.js'
import { cellKey, scoreWord } from '../lib/board.js'
import { Confetti, StatCard } from './Shared.jsx'

// Background tint class for a premium square.
const premClass = (p) => {
  if (!p) return ''
  if (p.label === '★') return 'star'
  if (p.label === 'DL') return 'prem-dl'
  if (p.label === 'TL') return 'prem-tl'
  return 'prem-tw'
}

export default function BoardScreen({ challenges, onResult, onExit }) {
  const [index, setIndex] = useState(0)
  const [placements, setPlacements] = useState({}) // "r,c" -> { id, ch }
  const [hintShown, setHintShown] = useState(false)
  const [status, setStatus] = useState('playing') // playing | solved | revealed
  const [shake, setShake] = useState(0)
  const [rackOrder, setRackOrder] = useState([])
  const [stats, setStats] = useState({ solved: 0, revealed: 0, score: 0 })
  const [done, setDone] = useState(false)

  const puzzle = challenges[index]

  useEffect(() => {
    setPlacements({})
    setHintShown(false)
    setStatus('playing')
    setShake(0)
    if (puzzle) setRackOrder(puzzle.rack.map((t) => t.id))
  }, [index, puzzle])

  const points = useMemo(() => (puzzle ? scoreWord(puzzle) : 0), [puzzle])

  if (!puzzle) return null

  if (done) {
    const total = challenges.length
    return (
      <div className="container">
        {stats.solved > 0 && <Confetti />}
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        >
          <div className="results-headline">
            <Trophy size={26} color="var(--yellow-deep)" /> Board complete!
          </div>
          <p style={{ marginTop: 10, color: 'var(--ink-soft)' }}>
            You placed {stats.solved} of {total} words on your own.
          </p>
          <div className="stats-grid" style={{ marginTop: 18 }}>
            <StatCard variant="success" icon={Check} label="Placed" value={stats.solved} />
            <StatCard variant="warning" icon={Eye} label="Revealed" value={stats.revealed} />
            <StatCard variant="info" icon={Coins} label="Score" value={stats.score} />
            <StatCard variant="accent" icon={LayoutGrid} label="Boards" value={total} />
          </div>
          <div className="navigation">
            <button onClick={onExit}>
              <LogOut size={16} /> Menu
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const usedIds = new Set(Object.values(placements).map((t) => t.id))
  const firstOpen = puzzle.slots.findIndex((s) => !placements[cellKey(s.r, s.c)])
  const target = puzzle.target

  const evaluate = (next) => {
    const formed = puzzle.targetCells
      .map((cell) => (cell.pre ? cell.ch : next[cellKey(cell.r, cell.c)]?.ch || ''))
      .join('')
    if (formed === target.word) {
      setStatus('solved')
      setStats((s) => ({ ...s, solved: s.solved + 1, score: s.score + points }))
      onResult(target.word, 'mastered')
    } else {
      setShake((n) => n + 1)
      setTimeout(() => {
        setPlacements((p) => (Object.keys(p).length === puzzle.slots.length ? {} : p))
      }, 520)
    }
  }

  const placeTile = (tile) => {
    if (status !== 'playing' || usedIds.has(tile.id) || firstOpen === -1) return
    const slot = puzzle.slots[firstOpen]
    const next = { ...placements, [cellKey(slot.r, slot.c)]: tile }
    setPlacements(next)
    if (Object.keys(next).length === puzzle.slots.length) evaluate(next)
  }

  const removeSlot = (key) => {
    if (status !== 'playing') return
    setPlacements((p) => {
      const n = { ...p }
      delete n[key]
      return n
    })
  }

  const reveal = () => {
    if (status !== 'playing') return
    setStatus('revealed')
    setStats((s) => ({ ...s, revealed: s.revealed + 1 }))
    onResult(target.word, 'needs-practice')
  }

  const next = () => {
    if (index < challenges.length - 1) setIndex(index + 1)
    else setDone(true)
  }

  const shuffleRack = () => setRackOrder((ids) => [...ids].sort(() => Math.random() - 0.5))

  const rackTiles = rackOrder.map((id) => puzzle.rack.find((t) => t.id === id))
  const last = index === challenges.length - 1

  // Render the board cell by cell.
  const cells = []
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      const key = cellKey(r, c)
      const pre = puzzle.placed.get(key)
      const slot = puzzle.slots.find((s) => s.r === r && s.c === c)
      const prem = puzzle.premiums.get(key)

      let inner = null
      let cls = 'bcell'

      if (pre) {
        inner = (
          <span className={`btile ${pre.crossing ? 'context' : 'anchor'}`}>
            {pre.ch}
            <span className="bpts">{scrabbleValues[pre.ch]}</span>
          </span>
        )
      } else if (slot) {
        const placedTile = placements[key]
        const showAnswer = status === 'revealed'
        if (placedTile) {
          inner = (
            <button className="btile placed" onClick={() => removeSlot(key)}>
              {placedTile.ch}
              <span className="bpts">{scrabbleValues[placedTile.ch]}</span>
            </button>
          )
        } else if (showAnswer) {
          inner = (
            <span className="btile reveal">
              {slot.ch}
              <span className="bpts">{scrabbleValues[slot.ch]}</span>
            </span>
          )
        } else {
          const isNext = puzzle.slots[firstOpen] && puzzle.slots[firstOpen].r === r && puzzle.slots[firstOpen].c === c
          cls += isNext ? ' slot next' : ' slot'
        }
      } else if (prem) {
        cls += ` ${premClass(prem)}`
        inner = <span className="prem-label">{prem.label}</span>
      }

      cells.push(
        <div key={key} className={cls}>
          {inner}
        </div>,
      )
    }
  }

  return (
    <div className="container">
      {status === 'solved' && <Confetti count={70} />}

      <div className="quiz-info" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <CircleDot size={14} /> Board {index + 1} / {challenges.length}
        </span>
        <button onClick={onExit} style={{ minHeight: 38, padding: '8px 14px', fontSize: 14 }}>
          <LogOut size={15} /> Exit
        </button>
      </div>

      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          animate={{ width: `${((index + (status !== 'playing' ? 1 : 0)) / challenges.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="card"
          key={index}
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -18 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        >
          <div className="mode-subtitle">
            <LayoutGrid size={14} /> Make the word
          </div>

          <p className="board-prompt" style={{ marginTop: 14 }}>
            {puzzle.cross
              ? 'Build a learned word through the tiles already on the board.'
              : 'Spell a learned word into the glowing squares.'}
          </p>

          <div className="word-points" style={{ marginTop: 6 }}>
            <Coins size={16} /> worth {points} points
          </div>

          <div className="board-wrap" key={shake} style={shake ? { animation: 'shakex 0.45s' } : undefined}>
            <div className="board-grid" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
              {cells}
            </div>
          </div>

          <AnimatePresence>
            {hintShown && (
              <motion.div
                className="board-hint"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Lightbulb size={16} />
                <span>{target.definition || 'A valid CSW24 word — trust your letters!'}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {status === 'playing' ? (
            <>
              <div className="rack-wrap">
                <div className="rack-label">Your rack — tap to place</div>
                <div className="rack">
                  {rackTiles.map((t) => (
                    <motion.button
                      key={t.id}
                      className="rtile"
                      onClick={() => placeTile(t)}
                      disabled={usedIds.has(t.id)}
                      whileTap={{ scale: 0.9 }}
                    >
                      {t.ch}
                      <span className="bpts">{scrabbleValues[t.ch]}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="navigation" style={{ marginTop: 18 }}>
                <button onClick={() => setHintShown(true)} disabled={hintShown}>
                  <Lightbulb size={16} /> Hint
                </button>
                <button onClick={shuffleRack}>
                  <Shuffle size={16} /> Shuffle
                </button>
                <button onClick={reveal}>
                  <Eye size={16} /> Reveal
                </button>
              </div>
            </>
          ) : (
            <>
              <motion.div
                className={`feedback ${status === 'solved' ? 'correct' : 'incorrect'}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                {status === 'solved' ? (
                  <>
                    <Check size={18} /> Nice! {target.word} · +{points} pts
                  </>
                ) : (
                  <>
                    <X size={18} /> Answer: {target.word}
                  </>
                )}
              </motion.div>

              <div className="navigation" style={{ marginTop: 18 }}>
                <button className="primary" onClick={next}>
                  {last ? (
                    <>
                      <Trophy size={16} /> Finish
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="stats-grid">
        <StatCard variant="success" icon={Check} label="Placed" value={stats.solved} />
        <StatCard variant="warning" icon={Eye} label="Revealed" value={stats.revealed} />
        <StatCard variant="info" icon={Coins} label="Score" value={stats.score} />
        <StatCard variant="accent" icon={CircleDot} label="Board" value={index + 1} />
      </div>
    </div>
  )
}
