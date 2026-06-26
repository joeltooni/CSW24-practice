import { motion, AnimatePresence } from 'framer-motion'
import {
  PencilLine,
  TextCursorInput,
  Lightbulb,
  ArrowRightLeft,
  Coins,
  Check,
  X,
  CircleDot,
  Send,
  LogOut,
} from 'lucide-react'
import { AnimatedWord, StatCard } from './Shared.jsx'

const MODE_META = {
  fillTheGap: { icon: PencilLine, label: 'Fill the Gap' },
  completeTheWord: { icon: TextCursorInput, label: 'Complete the Word' },
  guessMeaning: { icon: Lightbulb, label: 'Guess the Meaning' },
  meaningToWord: { icon: ArrowRightLeft, label: 'Meaning to Word' },
}

function ModeTag({ type }) {
  const meta = MODE_META[type]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <div className="mode-subtitle">
      <Icon size={14} /> {meta.label}
    </div>
  )
}

// Options reveal with a stagger; once answered, the correct option turns green
// and a wrong pick turns red.
function Options({ options, onAnswer, answered, answer, picked }) {
  return (
    <motion.div
      className="options-grid"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {options.map((opt, idx) => {
        let cls = 'option-button'
        if (answered) {
          if (opt === answer) cls += ' correct'
          else if (opt === picked) cls += ' wrong'
        }
        return (
          <motion.button
            key={idx}
            className={cls}
            onClick={() => onAnswer(opt)}
            disabled={answered}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            whileTap={answered ? {} : { scale: 0.95 }}
          >
            {answered && opt === answer && <Check size={16} />}
            {answered && opt === picked && opt !== answer && <X size={16} />}
            {opt}
          </motion.button>
        )
      })}
    </motion.div>
  )
}

export default function QuizScreen({
  quiz,
  quizIndex,
  quizCount,
  quizStats,
  feedback,
  picked,
  userInput,
  setUserInput,
  onAnswer,
  onSubmitWord,
  onExit,
}) {
  const answered = feedback !== null
  const accuracy = Math.round(
    (quizStats.correct / (quizStats.correct + quizStats.incorrect || 1)) * 100,
  )

  let content = null
  switch (quiz.type) {
    case 'fillTheGap':
      content = (
        <>
          <ModeTag type={quiz.type} />
          <div className="word-definition" style={{ marginTop: '18px' }}>
            {quiz.question}
          </div>
          <Options options={quiz.options} onAnswer={onAnswer} answered={answered} answer={quiz.answer} picked={picked} />
        </>
      )
      break
    case 'completeTheWord':
      content = (
        <>
          <ModeTag type={quiz.type} />
          <div className="word-points" style={{ marginTop: 12 }}>
            <Coins size={16} /> {quiz.points} points
          </div>
          <div className="word-definition">{quiz.definition}</div>
          <AnimatedWord text={quiz.displayWord} small />
          <input
            type="text"
            placeholder="Type the complete word"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !answered && onSubmitWord()}
            disabled={answered}
            autoFocus
          />
          <motion.button className="primary" onClick={onSubmitWord} disabled={answered} whileTap={{ scale: 0.95 }}>
            <Send size={16} /> Submit
          </motion.button>
        </>
      )
      break
    case 'guessMeaning':
      content = (
        <>
          <ModeTag type={quiz.type} />
          <AnimatedWord text={quiz.word.word} />
          <div className="word-points">
            <Coins size={16} /> {quiz.points} points
          </div>
          <Options options={quiz.options} onAnswer={onAnswer} answered={answered} answer={quiz.answer} picked={picked} />
        </>
      )
      break
    case 'meaningToWord':
      content = (
        <>
          <ModeTag type={quiz.type} />
          <div className="word-definition" style={{ marginTop: '18px' }}>
            {quiz.definition}
          </div>
          <div className="word-example">Which word means this?</div>
          <Options options={quiz.options} onAnswer={onAnswer} answered={answered} answer={quiz.answer} picked={picked} />
        </>
      )
      break
    default:
      content = null
  }

  return (
    <div className="container">
      <div className="quiz-info">
        <CircleDot size={14} /> Question {quizIndex + 1} / {quizCount}
      </div>

      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          animate={{ width: `${((quizIndex + (answered ? 1 : 0)) / quizCount) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="card"
          key={quizIndex}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        >
          {content}

          <AnimatePresence>
            {feedback && (
              <motion.div
                className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                {feedback.correct ? <Check size={18} /> : <X size={18} />}
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="navigation" style={{ marginTop: '18px' }}>
            <button onClick={onExit}>
              <LogOut size={16} /> Exit
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="stats-grid">
        <StatCard variant="success" icon={Check} label="Correct" value={quizStats.correct} />
        <StatCard variant="warning" icon={X} label="Incorrect" value={quizStats.incorrect} />
        <StatCard variant="info" icon={Coins} label="Score" value={quizStats.score} />
        <StatCard variant="accent" icon={CircleDot} label="Accuracy" value={accuracy} suffix="%" />
      </div>
    </div>
  )
}
