import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderCircle, SpellCheck2, AlertTriangle } from 'lucide-react'
import { getProgress, saveProgress } from './lib/db.js'
import { generateQuiz } from './lib/quiz.js'
import SetupScreen from './components/SetupScreen.jsx'
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
        const res = await fetch('./words-data.json')
        const data = await res.json()
        setWordData(data)

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
    if (selectedWordLength === 'mix') return wordData.words
    return wordData.words.filter((w) => w.length === parseInt(selectedWordLength, 10))
  }

  const masteredCount = Object.values(progress).filter((p) => p === 'mastered').length
  const needsPracticeCount = Object.values(progress).filter((p) => p === 'needs-practice').length

  const startStudy = () => {
    setStudyIndex(0)
    setScreen('study')
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
            onStudy={startStudy}
            onQuiz={startQuiz}
          />
        )}

        {screen === 'study' && (
          <StudyScreen
            studyWords={getStudyWords()}
            studyIndex={studyIndex}
            setStudyIndex={setStudyIndex}
            progress={progress}
            onMarkLearned={markStudyWordLearned}
            onExit={() => setScreen('setup')}
          />
        )}

        {screen === 'quiz' && quizzes.length > 0 && (
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
        )}

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
