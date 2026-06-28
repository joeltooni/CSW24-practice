// Board Challenge generation + a simplified Scrabble placement engine.
//
// Each instance seeds a board with existing words/letters and hands you a full
// 7-tile rack. You place tiles freely to form ANY word in the database, as long
// as it runs through a letter already on the board. One word (the "target") is
// always guaranteed playable from your rack, and the Hint reveals its meaning.

import { scrabbleValues, matchesLength } from './quiz.js'

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
const randInt = (n) => Math.floor(Math.random() * n)

export const RACK_SIZE = 7

// Padding tiles, drawn roughly like a Scrabble bag so racks feel natural.
const BAG = (
  'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRRR' +
  'TTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ'
).split('')

export const cellKey = (r, c) => `${r},${c}`

// Set of every spelling in the data — the "dictionary" a play is checked against.
export const buildWordSet = (wordData) => new Set((wordData?.words || []).map((w) => w.word))

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
      if (dr === 0 && dc === 0) p = { kind: 'W', mult: 2, label: '★' }
      else if (dr === m && dc === m) p = { kind: 'W', mult: 3, label: 'TW' }
      else if ((dr === m && dc === 0) || (dr === 0 && dc === m)) p = { kind: 'W', mult: 3, label: 'TW' }
      else if (dr === dc)
        p = dr % 2 === 0 ? { kind: 'L', mult: 2, label: 'DL' } : { kind: 'L', mult: 3, label: 'TL' }
      else if ((dr === 0 || dc === 0) && (dr + dc) % 2 === 0) p = { kind: 'L', mult: 2, label: 'DL' }
      if (p) map.set(cellKey(r, c), p)
    }
  }
  return map
}

// Scatter an extra real word elsewhere on the board so there are more letters to
// build off. Kept out of the target's row so it never interferes with the
// guaranteed target play.
const placeExtraWord = (committed, pool, size, targetRow, targetWord) => {
  const cands = shuffle(pool).filter(
    (w) => w.word !== targetWord && w.word.length >= 2 && w.word.length <= 4,
  )
  for (const ew of cands.slice(0, 30)) {
    const L = ew.word.length
    const horiz = Math.random() < 0.5
    for (let tries = 0; tries < 10; tries++) {
      const r = horiz ? randInt(size) : randInt(size - L + 1)
      const c = horiz ? randInt(size - L + 1) : randInt(size)
      const cells = []
      let ok = true
      for (let k = 0; k < L; k++) {
        const rr = horiz ? r : r + k
        const cc = horiz ? c + k : c
        if (rr === targetRow || committed.has(cellKey(rr, cc))) {
          ok = false
          break
        }
        cells.push([rr, cc])
      }
      if (!ok) continue
      cells.forEach(([rr, cc], k) => committed.set(cellKey(rr, cc), ew.word[k]))
      return
    }
  }
}

// Build one instance: pre-place a crossing word (the through-hook), scatter an
// extra word, and deal a 7-tile rack that can always spell the target.
const buildPuzzle = (target, pool) => {
  const word = target.word
  const len = word.length
  const size = len <= 6 ? 9 : 11
  const m = (size - 1) / 2
  const row = m
  const col0 = Math.floor((size - len) / 2)

  const committed = new Map()
  let sharedCol = -1

  // Vertical crossing word sharing exactly one letter with the target — the
  // existing tile the target will be played through.
  const cands = shuffle(pool).filter(
    (w) => w.word !== word && w.word.length >= 2 && w.word.length <= 5,
  )
  let placedCross = false
  for (const ai of shuffle([...Array(len).keys()])) {
    for (const cw of cands) {
      const cj = cw.word.indexOf(word[ai])
      if (cj === -1) continue
      const startRow = row - cj
      if (startRow < 0 || startRow + cw.word.length > size) continue
      for (let k = 0; k < cw.word.length; k++) {
        committed.set(cellKey(startRow + k, col0 + ai), cw.word[k])
      }
      sharedCol = col0 + ai
      placedCross = true
      break
    }
    if (placedCross) break
  }

  if (!placedCross) {
    // Fallback: a single anchor letter from the target sits on the board.
    const ai = Math.floor(len / 2)
    committed.set(cellKey(row, col0 + ai), word[ai])
    sharedCol = col0 + ai
  }

  // Where the target reads, for Reveal and reference.
  const targetPlacement = []
  for (let i = 0; i < len; i++) {
    const c = col0 + i
    targetPlacement.push({ r: row, c, ch: word[i], pre: c === sharedCol })
  }

  placeExtraWord(committed, pool, size, row, word)

  // Rack: the target's letters except the one already on the board, padded to 7.
  const need = word.split('')
  const sharedLetter = word[sharedCol - col0]
  const idx = need.indexOf(sharedLetter)
  if (idx !== -1) need.splice(idx, 1)
  const padCount = Math.max(0, RACK_SIZE - need.length)
  const pads = shuffle(BAG).slice(0, padCount)
  const rack = shuffle([...need, ...pads])
    .slice(0, RACK_SIZE)
    .map((ch, i) => ({ id: i, ch }))

  return { target, size, committed, rack, premiums: premiumMap(size), targetPlacement }
}

// Validate a pending play against the board + dictionary, scoring it on success.
// `pending` is an object: { "r,c": { ch } }. Cross-words are not enforced (the
// learning dictionary is small) — only the main word must be valid and it must
// run through a letter already on the board.
export const validatePlay = (puzzle, pending, validSet) => {
  const { committed, premiums, size } = puzzle
  const keys = Object.keys(pending)
  if (keys.length === 0) return { ok: false, msg: 'Place some tiles to make a word.' }

  const inB = (r, c) => r >= 0 && c >= 0 && r < size && c < size
  const charAt = (r, c) => {
    const k = cellKey(r, c)
    if (pending[k]) return pending[k].ch
    if (committed.has(k)) return committed.get(k)
    return null
  }
  const filled = (r, c) => inB(r, c) && charAt(r, c) !== null

  const cells = keys.map((k) => {
    const [r, c] = k.split(',').map(Number)
    return { r, c }
  })
  const rows = new Set(cells.map((c) => c.r))
  const cols = new Set(cells.map((c) => c.c))

  let axis
  if (cells.length === 1) {
    const { r, c } = cells[0]
    axis = filled(r, c - 1) || filled(r, c + 1) ? 'H' : filled(r - 1, c) || filled(r + 1, c) ? 'V' : 'H'
  } else if (rows.size === 1) axis = 'H'
  else if (cols.size === 1) axis = 'V'
  else return { ok: false, msg: 'Tiles must line up in one row or column.' }

  const run = []
  if (axis === 'H') {
    const r = [...rows][0]
    const cvals = cells.map((x) => x.c)
    let s = Math.min(...cvals)
    let e = Math.max(...cvals)
    for (let c = s; c <= e; c++) if (!filled(r, c)) return { ok: false, msg: 'No gaps — fill the whole word.' }
    while (filled(r, s - 1)) s--
    while (filled(r, e + 1)) e++
    for (let c = s; c <= e; c++) run.push({ r, c })
  } else {
    const c = [...cols][0]
    const rvals = cells.map((x) => x.r)
    let s = Math.min(...rvals)
    let e = Math.max(...rvals)
    for (let r = s; r <= e; r++) if (!filled(r, c)) return { ok: false, msg: 'No gaps — fill the whole word.' }
    while (filled(s - 1, c)) s--
    while (filled(e + 1, c)) e++
    for (let r = s; r <= e; r++) run.push({ r, c })
  }

  const formedWord = run.map(({ r, c }) => charAt(r, c)).join('')
  if (formedWord.length < 2) return { ok: false, msg: 'Words must be at least 2 letters.' }
  if (!run.some(({ r, c }) => committed.has(cellKey(r, c))))
    return { ok: false, msg: 'Your word must run through a letter already on the board.' }
  if (!validSet.has(formedWord)) return { ok: false, msg: `“${formedWord}” isn’t in the word list.` }

  let sum = 0
  let wordMult = 1
  for (const { r, c } of run) {
    const k = cellKey(r, c)
    const base = scrabbleValues[charAt(r, c)] || 0
    const p = pending[k] ? premiums.get(k) : null
    if (p && p.kind === 'L') sum += base * p.mult
    else {
      sum += base
      if (p && p.kind === 'W') wordMult *= p.mult
    }
  }
  let score = sum * wordMult
  if (keys.length === RACK_SIZE) score += 50 // all 7 tiles — bingo!

  return { ok: true, word: formedWord, score, cells: run }
}

// Build a session of board instances from words engaged with in Study
// (seen / needs-practice / mastered). Returns [] when nothing has been studied.
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

  // Crossing / extra words are drawn from the whole word list for variety.
  return ordered.map((target) => buildPuzzle(target, wordData.words))
}
