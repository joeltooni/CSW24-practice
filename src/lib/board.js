// Board Challenge generation — turns learned words into "place it on the board"
// puzzles. Each puzzle pre-places an anchor (often a small crossing word) and
// leaves the rest of the target word as empty slots the player fills from a rack.

import { scrabbleValues, matchesLength } from './quiz.js'

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

// Letters used to pad the rack with plausible distractors (rough frequency order).
const DISTRACTOR_POOL = 'EAIONRTLSUDGCMPBHFYWKVXZJQ'.split('')

export const cellKey = (r, c) => `${r},${c}`

// Decorative + scoring premium squares for an odd N×N board, symmetric about the
// centre. Returns a Map of "r,c" -> { kind: 'L' | 'W', mult, label }.
export const premiumMap = (size) => {
  const m = (size - 1) / 2
  const map = new Map()
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const dr = Math.abs(r - m)
      const dc = Math.abs(c - m)
      let p = null
      if (dr === 0 && dc === 0) p = { kind: 'W', mult: 2, label: '★' } // centre star
      else if (dr === m && dc === m) p = { kind: 'W', mult: 3, label: 'TW' } // corners
      else if ((dr === m && dc === 0) || (dr === 0 && dc === m))
        p = { kind: 'W', mult: 3, label: 'TW' } // edge midpoints
      else if (dr === dc)
        p = dr % 2 === 0 ? { kind: 'L', mult: 2, label: 'DL' } : { kind: 'L', mult: 3, label: 'TL' }
      else if ((dr === 0 || dc === 0) && (dr + dc) % 2 === 0) p = { kind: 'L', mult: 2, label: 'DL' }
      if (p) map.set(cellKey(r, c), p)
    }
  }
  return map
}

// Square board sized to comfortably hold the target (and any crossing word),
// kept odd so the word centres cleanly. Clamped to a mobile-friendly range.
const boardSize = (targetLen, crossLen = 0) => {
  let n = Math.max(targetLen, crossLen) + 2
  n = Math.max(7, Math.min(13, n))
  if (n % 2 === 0) n += 1
  return n
}

// Build a single placement puzzle for `target`, optionally hooking a perpendicular
// crossing word drawn from `pool` for that real-board feel.
const buildPuzzle = (target, pool) => {
  const word = target.word
  const len = word.length

  // Try to attach a vertical crossing word sharing exactly one letter (len >= 3).
  let cross = null // { word, ai, cj } — ai: index in target, cj: index in crossing
  if (len >= 3) {
    const candidates = shuffle(pool).filter(
      (w) => w.word !== word && w.word.length >= 2 && w.word.length <= 5,
    )
    const indices = shuffle([...Array(len).keys()])
    outer: for (const ai of indices) {
      for (const cw of candidates) {
        const cj = cw.word.indexOf(word[ai])
        if (cj !== -1) {
          cross = { word: cw.word, ai, cj }
          break outer
        }
      }
    }
  }

  const size = boardSize(len, cross ? cross.word.length : 0)
  const m = (size - 1) / 2
  const row = m
  const col0 = Math.floor((size - len) / 2)

  const placed = new Map() // "r,c" -> { ch, crossing }

  if (cross) {
    const startRow = row - cross.cj
    if (startRow >= 0 && startRow + cross.word.length <= size) {
      for (let k = 0; k < cross.word.length; k++) {
        placed.set(cellKey(startRow + k, col0 + cross.ai), {
          ch: cross.word[k],
          crossing: startRow + k !== row, // the shared cell belongs to the target row
        })
      }
    } else {
      cross = null // doesn't fit — fall back to a single anchor below
    }
  }

  if (!cross && len >= 3) {
    const ai = Math.floor(len / 2)
    placed.set(cellKey(row, col0 + ai), { ch: word[ai], crossing: false })
  }
  // 2-letter targets get no pre-placed anchor — both cells are slots.

  // Target cells across, marking which are already on the board vs. empty slots.
  const targetCells = []
  const slots = []
  for (let i = 0; i < len; i++) {
    const c = col0 + i
    const key = cellKey(row, c)
    const pre = placed.has(key)
    targetCells.push({ r: row, c, ch: word[i], pre })
    if (!pre) slots.push({ r: row, c, ch: word[i] })
  }

  // Rack: the letters the player must place, plus a couple of distractors,
  // capped near a real 7-tile rack.
  const need = slots.map((s) => s.ch)
  const distractorCount = Math.max(0, Math.min(2, 7 - need.length))
  const avoid = new Set(need)
  const distractors = []
  for (const ch of shuffle(DISTRACTOR_POOL)) {
    if (distractors.length >= distractorCount) break
    if (!avoid.has(ch)) distractors.push(ch)
  }
  const rack = shuffle([...need, ...distractors]).map((ch, i) => ({ id: i, ch }))

  return {
    target,
    size,
    row,
    col0,
    placed,
    targetCells,
    slots,
    rack,
    cross,
    premiums: premiumMap(size),
  }
}

// Score the target word as if just played: letter/word multipliers apply only to
// newly placed tiles (the slots); pre-placed anchor letters count face value.
export const scoreWord = (puzzle) => {
  let sum = 0
  let wordMult = 1
  for (const cell of puzzle.targetCells) {
    const base = scrabbleValues[cell.ch] || 0
    const p = !cell.pre && puzzle.premiums.get(cellKey(cell.r, cell.c))
    if (p && p.kind === 'L') sum += base * p.mult
    else {
      sum += base
      if (p && p.kind === 'W') wordMult *= p.mult
    }
  }
  return sum * wordMult
}

// Build a session of board challenges from words the player has engaged with in
// Study (seen / needs-practice / mastered). Returns [] when nothing in the
// category has been studied yet — the UI then prompts the user to study first.
// Ordering favours needs-practice → seen → mastered, ties shuffled.
export const generateBoardChallenges = (wordData, count, length, progress) => {
  if (!wordData) return []
  const filtered = wordData.words.filter((w) => matchesLength(w, length))
  const learned = filtered.filter((w) => progress[w.word])
  if (learned.length === 0) return []

  const statusRank = (w) => {
    const s = progress[w.word]
    return s === 'needs-practice' ? 0 : s === 'seen' ? 1 : 2
  }

  const ordered = learned
    .map((w) => ({ w, s: statusRank(w), j: Math.random() }))
    .sort((a, b) => a.s - b.s || a.j - b.j)
    .slice(0, count)
    .map((x) => x.w)

  return ordered.map((target) => buildPuzzle(target, learned))
}
