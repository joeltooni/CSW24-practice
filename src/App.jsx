import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderCircle, SpellCheck2, AlertTriangle, BookOpen } from 'lucide-react'
import { getProgress, saveProgress, clearProgress } from './lib/db.js'
import { generateQuiz, matchesLength, extractWords } from './lib/quiz.js'

// Extra word files merged on top of the core list. A `category` marks a curated
// category (its words are tagged so a chip can filter to exactly that set); files
// without one are matched by a derived rule (length / letters). Add more here.
const EXTRA_WORD_FILES = [
  { file: './7-8_letters_updated.json' },
  { file: './jqxz.json' },
  { file: './q-not-qu.json' },
  { file: './vowels.json', category: 'vowels', label: 'Vowels' },
  { file: './dumps.json', category: 'dumps', label: 'Dumps' },
]

// Full list of category chips (excluding "All") available for the given words —
// derived length/letter categories plus curated tag categories that have words.
const buildCategories = (words) => {
  const cats = [
    { id: '2', label: '2-Letter' },
    { id: '3', label: '3-Letter' },
  ]
  if (words.some((w) => w.length === 7 || w.length === 8)) cats.push({ id: '7-8', label: '7–8' })
  if (words.some((w) => /[JQXZ]/.test(w.word.toUpperCase()))) cats.push({ id: 'jqxz', label: 'JQXZ' })
  if (words.some((w) => /Q(?!U)/i.test(w.word))) cats.push({ id: 'q-no-u', label: 'Q (no U)' })
  EXTRA_WORD_FILES.filter(
    (e) => e.category && words.some((w) => w.categories?.includes(e.category)),
  ).forEach((e) => cats.push({ id: e.category, label: e.label }))
  return cats
}

const fetchJsonSafe = async (url) => {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null // missing / empty / invalid — just skip it
  }
}
import SetupScreen from './components/SetupScreen.jsx'
import SearchScreen from './components/SearchScreen.jsx'
import MasteredScreen from './components/MasteredScreen.jsx'
import StudyScreen from './components/StudyScreen.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'

export default function App() {
  const [wordData, setWordData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState('setup') // setup | study | quiz | results
  const [sessionQuestions, setSessionQuestions] = useState(15)
  const [progress, setProgress] = useState({})
  const [selectedWordLength, setSelectedWordLength] = useState('mix')

  // Quiz state
  const [quizzes, setQuizzes] = useState([])
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [quizStats, setQuizStats] = useState({ correct: 0, incorrect: 0, score: 0 })
  const [feedback, setFeedback] = useState(null) // { correct: bool, text: string }
  const [picked, setPicked] = useState(null)
  const [userInput, setUserInput] = useState('')

  // Study state
  const [studyIndex, setStudyIndex] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJsonSafe('./words-data.json')
        if (!data) throw new Error('core word data missing')

        // Merge extra files, tagging curated-category words. Dedupe by spelling
        // across the base list and every file, unioning category tags so a word
        // shared by several files keeps all its categories and appears once.
        const extras = await Promise.all(EXTRA_WORD_FILES.map((e) => fetchJsonSafe(e.file)))
        const extraWords = extras.flatMap((d, i) => {
          const cat = EXTRA_WORD_FILES[i].category
          const ws = extractWords(d)
          return cat ? ws.map((w) => ({ ...w, categories: [cat] })) : ws
        })

        const byWord = new Map()
        const addWord = (w) => {
          const existing = byWord.get(w.word)
          if (existing) {
            for (const c of w.categories || []) {
              if (!existing.categories.includes(c)) existing.categories.push(c)
            }
          } else {
            byWord.set(w.word, { ...w, categories: [...(w.categories || [])] })
          }
        }
        data.words.forEach(addWord)
        extraWords.forEach(addWord)

        const words = [...byWord.values()]
        const groups = [
          ...new Set([...(data.groups || []), ...words.map((w) => w.group).filter(Boolean)]),
        ]

        setWordData({ words, groups })

        const progressData = await getProgress()
        const map = {}
        progressData.forEach((p) => {
          map[p.word] = p.status
        })
        setProgress(map)
      } catch (err) {
        console.error('Error loading data:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const getStudyWords = () => {
    if (!wordData) return []
    return wordData.words.filter((w) => matchesLength(w, selectedWordLength))
  }

  // When the length changes, keep the question count within what's available.
  useEffect(() => {
    if (!wordData) return
    const available = wordData.words.filter((w) => matchesLength(w, selectedWordLength)).length
    const cap = Math.min(100, Math.max(1, available))
    setSessionQuestions((q) => Math.min(q, cap))
  }, [selectedWordLength, wordData])

  const masteredCount = Object.values(progress).filter((p) => p === 'mastered').length
  const needsPracticeCount = Object.values(progress).filter((p) => p === 'needs-practice').length

  // Resume position is saved per category so Study continues where you stopped.
  const studyPosKey = (cat) => `study-pos:${cat}`

  const startStudy = () => {
    const max = Math.max(0, getStudyWords().length - 1)
    const saved = parseInt(localStorage.getItem(studyPosKey(selectedWordLength)) || '0', 10)
    setStudyIndex(Math.min(Math.max(0, saved || 0), max))
    setScreen('study')
  }

  // Persist the study position whenever it changes during a study session.
  useEffect(() => {
    if (screen !== 'study') return
    localStorage.setItem(studyPosKey(selectedWordLength), String(studyIndex))
  }, [studyIndex, screen, selectedWordLength])

  // Mark a word "seen" the first time it's viewed (never downgrade a real status).
  const markSeen = (word) => {
    setProgress((prev) => {
      if (prev[word]) return prev
      saveProgress(word, 'seen')
      return { ...prev, [word]: 'seen' }
    })
  }

  const startQuiz = () => {
    const generated = generateQuiz(wordData, sessionQuestions, selectedWordLength, progress)
    setQuizzes(generated)
    setCurrentQuizIndex(0)
    setQuizStats({ correct: 0, incorrect: 0, score: 0 })
    setUserInput('')
    setFeedback(null)
    setPicked(null)
    setScreen('quiz')
  }

  const markProgress = (word, status) => {
    saveProgress(word, status)
    setProgress((prev) => ({ ...prev, [word]: status }))
  }

  const resetProgress = async () => {
    await clearProgress()
    setProgress({})
  }

  const handleQuizAnswer = (answer) => {
    if (feedback) return
    const quiz = quizzes[currentQuizIndex]
    const isCorrect = answer === quiz.answer
    setPicked(answer)

    if (isCorrect) {
      setFeedback({ correct: true, text: 'Correct!' })
      setQuizStats((s) => ({ ...s, correct: s.correct + 1, score: s.score + quiz.word.points }))
      markProgress(quiz.word.word, 'mastered')
    } else {
      setFeedback({ correct: false, text: `Answer: ${quiz.answer}` })
      setQuizStats((s) => ({ ...s, incorrect: s.incorrect + 1 }))
      markProgress(quiz.word.word, 'needs-practice')
    }

    setTimeout(() => {
      if (currentQuizIndex < quizzes.length - 1) {
        setCurrentQuizIndex((i) => i + 1)
        setUserInput('')
        setFeedback(null)
        setPicked(null)
      } else {
        setScreen('results')
      }
    }, 1500)
  }

  const handleCompleteWordSubmit = () => {
    const quiz = quizzes[currentQuizIndex]
    const guess = userInput.toUpperCase()
    handleQuizAnswer(guess === quiz.answer ? quiz.answer : guess || 'WRONG')
  }

  const markStudyWordLearned = async () => {
    const studyWords = getStudyWords()
    const word = studyWords[studyIndex]
    markProgress(word.word, 'mastered')
    if (studyIndex < studyWords.length - 1) {
      setStudyIndex(studyIndex + 1)
    } else {
      setScreen('setup')
    }
  }

  if (loading) {
    return (
      <div className="loading-wrap">
        <div>
          <div className="brand-mark" style={{ margin: '0 auto 16px' }}>
            <SpellCheck2 size={26} />
          </div>
          <LoaderCircle size={32} className="spinner-icon" />
          <p style={{ color: 'var(--muted)', marginTop: 12 }}>Loading word data…</p>
        </div>
      </div>
    )
  }

  if (!wordData) {
    return (
      <div className="loading-wrap">
        <div className="card" style={{ maxWidth: 360 }}>
          <AlertTriangle size={32} color="var(--error)" style={{ marginBottom: 12 }} />
          <h2>Couldn't load words</h2>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>
            Make sure <code>words-data.json</code> is present.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {screen === 'setup' && (
          <SetupScreen
            wordData={wordData}
            masteredCount={masteredCount}
            needsPracticeCount={needsPracticeCount}
            selectedWordLength={selectedWordLength}
            setSelectedWordLength={setSelectedWordLength}
            sessionQuestions={sessionQuestions}
            setSessionQuestions={setSessionQuestions}
            availableCount={getStudyWords().length}
            categories={EXTRA_WORD_FILES.filter(
              (e) => e.category && wordData.words.some((w) => w.categories?.includes(e.category)),
            ).map((e) => ({ id: e.category, label: e.label }))}
            onStudy={startStudy}
            onQuiz={startQuiz}
            onReset={resetProgress}
            onSearch={() => setScreen('search')}
            onShowMastered={() => setScreen('mastered')}
          />
        )}

        {screen === 'mastered' && (
          <MasteredScreen
            words={wordData.words}
            progress={progress}
            categories={buildCategories(wordData.words)}
            onExit={() => setScreen('setup')}
          />
        )}

        {screen === 'search' && (
          <SearchScreen
            words={wordData.words}
            progress={progress}
            onExit={() => setScreen('setup')}
          />
        )}

        {screen === 'study' && (
          <StudyScreen
            studyWords={getStudyWords()}
            studyIndex={studyIndex}
            setStudyIndex={setStudyIndex}
            progress={progress}
            onSeen={markSeen}
            onMarkLearned={markStudyWordLearned}
            onExit={() => setScreen('setup')}
          />
        )}

        {screen === 'quiz' &&
          (quizzes.length > 0 ? (
            <QuizScreen
              quiz={quizzes[currentQuizIndex]}
              quizIndex={currentQuizIndex}
              quizCount={quizzes.length}
              quizStats={quizStats}
              feedback={feedback}
              picked={picked}
              userInput={userInput}
              setUserInput={setUserInput}
              onAnswer={handleQuizAnswer}
              onSubmitWord={handleCompleteWordSubmit}
              onExit={() => setScreen('setup')}
            />
          ) : (
            <div className="container">
              <div className="card">
                <BookOpen size={36} color="var(--accent)" style={{ marginBottom: 10 }} />
                <h2>Study these words first</h2>
                <p style={{ marginTop: 8, color: 'var(--ink-soft)' }}>
                  You haven't studied any words in this category yet. Study them, then come back to
                  quiz yourself on what you've seen.
                </p>
                <div className="navigation">
                  <button className="primary" onClick={startStudy}>
                    <BookOpen size={18} /> Study Mode
                  </button>
                  <button onClick={() => setScreen('setup')}>Back to Menu</button>
                </div>
              </div>
            </div>
          ))}

        {screen === 'results' && (
          <ResultsScreen
            quizStats={quizStats}
            total={quizzes.length}
            onMenu={() => setScreen('setup')}
            onRetry={startQuiz}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
