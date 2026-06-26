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

const generateFillTheGap = (word, allWords) => {
  const gapSentence = word.exampleSentence.replace(word.word, '____')
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
    word: word.word,
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

// Build a prioritized quiz set: needs-practice first, then rare, then common.
export const generateQuiz = (wordData, questionCount, length, progress) => {
  if (!wordData) return []

  let filteredWords = wordData.words
  if (length !== 'mix') {
    filteredWords = filteredWords.filter((w) => w.length === parseInt(length, 10))
  }

  const rareWords = filteredWords.filter((w) => w.rarity === 'rare')
  const commonWords = filteredWords.filter((w) => w.rarity === 'common')
  const needsPractice = filteredWords.filter((w) => progress[w.word] === 'needs-practice')

  let candidates = [...needsPractice, ...rareWords, ...commonWords]
  candidates = candidates.filter(
    (w, i, arr) => arr.findIndex((x) => x.word === w.word) === i,
  )

  const selected = candidates.slice(0, questionCount)

  return selected.map((word) => {
    const make = generators[Math.floor(Math.random() * generators.length)]
    return make(word, filteredWords)
  })
}
