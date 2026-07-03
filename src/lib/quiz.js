// Scrabble scoring + quiz question generators.

export const scrabbleValues = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1,
  M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
  Y: 4, Z: 10,
}

export const calculateScore = (word) =>
  word
    .toUpperCase()
    .split('')
    .reduce((sum, letter) => sum + (scrabbleValues[letter] || 0), 0)

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

// Category filter: length buckets, derived letter categories, and curated
// category tags (e.g. vowels, dumps) carried on word.categories.
export const matchesLength = (word, sel) => {
  if (sel === 'mix') return true
  if (sel === '7-8') return word.length === 7 || word.length === 8
  if (sel === 'jqxz') return /[JQXZ]/.test(word.word.toUpperCase())
  if (sel === 'q-no-u') return /Q(?!U)/i.test(word.word) // a Q not followed by U
  if (/^\d+$/.test(sel)) return word.length === parseInt(sel, 10)
  return Array.isArray(word.categories) && word.categories.includes(sel)
}

// Normalize a raw word entry (from any extra category file) into the shape the
// app expects, filling in sensible defaults for anything missing.
export const normalizeWord = (raw, i = 0) => {
  const word = String(raw.word || '').toUpperCase()
  return {
    id: raw.id ?? 100000 + i,
    word,
    length: raw.length ?? word.length,
    points: raw.points ?? calculateScore(word),
    definition: raw.definition ?? '',
    exampleSentence: raw.exampleSentence ?? raw.example ?? '',
    group: raw.group ?? `${word.length}-Letter`,
    rarity: raw.rarity ?? 'rare',
    difficulty: raw.difficulty ?? 'hard',
    frontHooks: raw.frontHooks ?? '',
    backHooks: raw.backHooks ?? '',
  }
}

// Accept either a bare array or a { words: [...] } object; ignore junk/empty.
export const extractWords = (data) => {
  const arr = Array.isArray(data) ? data : Array.isArray(data?.words) ? data.words : []
  return arr.filter((w) => w && w.word).map((w, i) => normalizeWord(w, i))
}

const generateFillTheGap = (word, allWords) => {
  // Blank the target word case-insensitively (sentences may store it lowercase).
  const boundary = new RegExp(`\\b${word.word}\\b`, 'i')
  let gapSentence = word.exampleSentence.replace(boundary, '____')
  if (gapSentence === word.exampleSentence) {
    gapSentence = word.exampleSentence.replace(new RegExp(word.word, 'i'), '____')
  }
  const wrongWords = shuffle(
    allWords.filter((w) => w.word !== word.word && w.length === word.length),
  ).slice(0, 2)
  const options = shuffle([word.word, ...wrongWords.map((w) => w.word)])
  return { type: 'fillTheGap', question: gapSentence, options, answer: word.word, word }
}

const generateCompleteTheWord = (word) => {
  const chars = word.word.split('')
  const blanks = Math.ceil(chars.length / 3)
  const positions = []
  for (let i = 0; i < blanks; i++) {
    let pos
    do {
      pos = Math.floor(Math.random() * chars.length)
    } while (positions.includes(pos))
    positions.push(pos)
  }
  const displayWord = chars.map((c, i) => (positions.includes(i) ? '_' : c)).join('')
  return {
    type: 'completeTheWord',
    displayWord,
    definition: word.definition,
    points: word.points,
    answer: word.word,
    word,
  }
}

const generateGuessMeaning = (word, allWords) => {
  const wrongWords = shuffle(allWords.filter((w) => w.word !== word.word)).slice(0, 2)
  const options = shuffle([word.definition, ...wrongWords.map((w) => w.definition)])
  return {
    type: 'guessMeaning',
    points: word.points,
    options,
    answer: word.definition,
    word,
  }
}

const generateMeaningToWord = (word, allWords) => {
  const wrongWords = shuffle(
    allWords.filter((w) => w.word !== word.word && w.length === word.length),
  ).slice(0, 2)
  const options = shuffle([word.word, ...wrongWords.map((w) => w.word)])
  return { type: 'meaningToWord', definition: word.definition, options, answer: word.word, word }
}

const generators = [
  generateFillTheGap,
  generateCompleteTheWord,
  generateGuessMeaning,
  generateMeaningToWord,
]

// Quiz only words you've engaged with in Study (seen / mastered / needs-practice).
// Returns [] when nothing in the category has been studied yet — the UI then
// prompts the user to study first. Order: needs-practice → seen → mastered, with
// rare favoured within each tier and ties shuffled. Distractor options may still
// be drawn from any word in the category for variety.
export const generateQuiz = (wordData, questionCount, length, progress) => {
  if (!wordData) return []

  const filteredWords = wordData.words.filter((w) => matchesLength(w, length))
  const pool = filteredWords.filter((w) => progress[w.word])
  if (pool.length === 0) return []

  const statusRank = (w) => {
    const s = progress[w.word]
    if (s === 'needs-practice') return 0
    if (s === 'seen') return 1
    return 2 // mastered
  }
  const rarityRank = (w) => (w.rarity === 'rare' ? 0 : 1)

  const selected = pool
    .map((w) => ({ w, s: statusRank(w), r: rarityRank(w), j: Math.random() }))
    .sort((a, b) => a.s - b.s || a.r - b.r || a.j - b.j)
    .slice(0, questionCount)
    .map((x) => x.w)

  return selected.map((word) => {
    const make = generators[Math.floor(Math.random() * generators.length)]
    return make(word, filteredWords)
  })
}
