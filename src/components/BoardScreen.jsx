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
  Undo2,
  Send,
} from 'lucide-react'
import { scrabbleValues } from '../lib/quiz.js'
import { cellKey, validatePlay } from '../lib/board.js'
import { Confetti, StatCard } from './Shared.jsx'

const premClass = (p) => {
  if (!p) return ''
  if (p.label === '★') return 'star'
  if (p.label === 'DL') return 'prem-dl'
  if (p.label === 'TL') return 'prem-tl'
  return 'prem-tw'
}

export default function BoardScreen({ challenges, validWords, onResult, onExit }) {
  const [index, setIndex] = useState(0)
  const [pending, setPending] = useState({}) // "r,c" -> { id, ch }
  const [selectedId, setSelectedId] = useState(null) // rack tile picked up
  const [hintShown, setHintShown] = useState(false)
  const [status, setStatus] = useState('playing') // playing | solved | revealed
  const [shake, setShake] = useState(0)
  const [rackOrder, setRackOrder] = useState([])
  const [stats, setStats] = useState({ solved: 0, revealed: 0, score: 0 })
  const [solvedPlay, setSolvedPlay] = useState(null) // { word, score }
  const [done, setDone] = useState(false)

  const puzzle = challenges[index]

  useEffect(() => {
    setPending({})
    setSelectedId(null)
    setHintShown(false)
    setStatus('playing')
    setShake(0)
    setSolvedPlay(null)
    if (puzzle) setRackOrder(puzzle.rack.map((t) => t.id))
  }, [index, puzzle])

  // Live read of the word currently being formed.
  const preview = useMemo(() => {
    if (!puzzle || Object.keys(pending).length === 0) return null
    return validatePlay(puzzle, pending, validWords)
  }, [puzzle, pending, validWords])

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
            You played {stats.solved} of {total} words for {stats.score} points.
          </p>
          <div className="stats-grid" style={{ marginTop: 18 }}>
            <StatCard variant="success" icon={Check} label="Played" value={stats.solved} />
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

  const target = puzzle.target
  const usedIds = new Set(Object.values(pending).map((t) => t.id))
  const rackTiles = rackOrder.map((id) => puzzle.rack.find((t) => t.id === id))
  const last = index === challenges.length - 1

  const tapRackTile = (t) => {
    if (status !== 'playing' || usedIds.has(t.id)) return
    setSelectedId((id) => (id === t.id ? null : t.id))
  }

  const tapCell = (r, c) => {
    if (status !== 'playing') return
    const key = cellKey(r, c)
    if (puzzle.committed.has(key)) return
    if (pending[key]) {
      // recall this tile back to the rack
      setPending((p) => {
        const n = { ...p }
        delete n[key]
        return n
      })
      return
    }
    if (selectedId == null) return
    const tile = puzzle.rack.find((t) => t.id === selectedId)
    if (!tile || usedIds.has(tile.id)) return
    setPending((p) => ({ ...p, [key]: { id: tile.id, ch: tile.ch } }))
    setSelectedId(null)
  }

  const recallAll = () => {
    if (status !== 'playing') return
    setPending({})
    setSelectedId(null)
  }

  const shuffleRack = () => setRackOrder((ids) => [...ids].sort(() => Math.random() - 0.5))

  const playWord = () => {
    if (status !== 'playing') return
    const res = validatePlay(puzzle, pending, validWords)
    if (res.ok) {
      setStatus('solved')
      setSolvedPlay({ word: res.word, score: res.score })
      setStats((s) => ({ ...s, solved: s.solved + 1, score: s.score + res.score }))
      onResult(res.word, 'mastered')
    } else {
      setShake((n) => n + 1)
    }
  }

  const reveal = () => {
    if (status !== 'playing') return
    setStatus('revealed')
    setPending({})
    setSelectedId(null)
    setStats((s) => ({ ...s, revealed: s.revealed + 1 }))
    onResult(target.word, 'needs-practice')
  }

  const next = () => {
    if (index < challenges.length - 1) setIndex(index + 1)
    else setDone(true)
  }

  // Cells the target occupies (for Reveal display).
  const revealCells = new Map(puzzle.targetPlacement.map((c) => [cellKey(c.r, c.c), c.ch]))

  const cells = []
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      const key = cellKey(r, c)
      const committedCh = puzzle.committed.get(key)
      const pendTile = pending[key]
      const prem = puzzle.premiums.get(key)

      let cls = 'bcell'
      let inner = null

      if (committedCh) {
        inner = (
          <span className="btile context">
            {committedCh}
            <span className="bpts">{scrabbleValues[committedCh]}</span>
          </span>
        )
      } else if (pendTile) {
        inner = (
          <button className="btile pending" onClick={() => tapCell(r, c)}>
            {pendTile.ch}
            <span className="bpts">{scrabbleValues[pendTile.ch]}</span>
          </button>
        )
      } else if (status === 'revealed' && revealCells.has(key)) {
        const ch = revealCells.get(key)
        inner = (
          <span className="btile reveal">
            {ch}
            <span className="bpts">{scrabbleValues[ch]}</span>
          </span>
        )
      } else {
        if (prem) {
          cls += ` ${premClass(prem)}`
          inner = <span className="prem-label">{prem.label}</span>
        }
        if (status === 'playing' && selectedId != null) cls += ' placeable'
        cells.push(
          <button key={key} className={cls} onClick={() => tapCell(r, c)}>
            {inner}
          </button>,
        )
        continue
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
            <LayoutGrid size={14} /> Play a word
          </div>

          <p className="board-prompt" style={{ marginTop: 14 }}>
            Make any word from the list. It must run through a letter already on the board.
          </p>

          <div className="board-wrap" key={shake} style={shake ? { animation: 'shakex 0.45s' } : undefined}>
            <div className="board-grid" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
              {cells}
            </div>
          </div>

          {/* Live status of the word being formed */}
          {status === 'playing' && (
            <div className="board-status">
              {preview && preview.ok ? (
                <span className="word-now ok">
                  <Check size={15} /> {preview.word} · +{preview.score}
                </span>
              ) : preview ? (
                <span className="board-note">{preview.msg}</span>
              ) : (
                <span className="board-note">Tap a tile, then tap a square to place it.</span>
              )}
            </div>
          )}

          <AnimatePresence>
            {hintShown && status === 'playing' && (
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
                <div className="rack-label">Your rack — tap a tile, then a square</div>
                <div className="rack">
                  {rackTiles.map((t) => (
                    <motion.button
                      key={t.id}
                      className={`rtile ${selectedId === t.id ? 'sel' : ''}`}
                      onClick={() => tapRackTile(t)}
                      disabled={usedIds.has(t.id)}
                      whileTap={{ scale: 0.9 }}
                    >
                      {t.ch}
                      <span className="bpts">{scrabbleValues[t.ch]}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="navigation" style={{ marginTop: 16 }}>
                <button
                  className="success"
                  onClick={playWord}
                  disabled={!preview || !preview.ok}
                >
                  <Send size={16} /> Play
                </button>
                <button onClick={recallAll} disabled={Object.keys(pending).length === 0}>
                  <Undo2 size={16} /> Recall
                </button>
              </div>

              <div className="navigation" style={{ marginTop: 10 }}>
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
                    <Check size={18} /> Nice! {solvedPlay.word} · +{solvedPlay.score} pts
                  </>
                ) : (
                  <>
                    <X size={18} /> One answer: {target.word}
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
        <StatCard variant="success" icon={Check} label="Played" value={stats.solved} />
        <StatCard variant="warning" icon={Eye} label="Revealed" value={stats.revealed} />
        <StatCard variant="info" icon={Coins} label="Score" value={stats.score} />
        <StatCard variant="accent" icon={CircleDot} label="Board" value={index + 1} />
      </div>
    </div>
  )
}
