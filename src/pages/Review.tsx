import { useGameStore } from '@/store/gameStore'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import ScoreDisplay from '@/components/ScoreDisplay'
import RadarChart from '@/components/RadarChart'
import DecisionTimeline from '@/components/DecisionTimeline'
import MissedClues from '@/components/MissedClues'
import OptimalComparison from '@/components/OptimalComparison'
import { RotateCcw, Thermometer, Star } from 'lucide-react'

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: 'easeOut' },
  }),
}

export default function Review() {
  const navigate = useNavigate()
  const {
    currentCase,
    gameScore,
    playerDecisions,
    revealedClues,
    actedUponClues,
    tempHistory,
    resetGame,
  } = useGameStore()

  useEffect(() => {
    if (!currentCase || !gameScore) {
      navigate('/')
    }
  }, [currentCase, gameScore, navigate])

  if (!currentCase || !gameScore) return null

  const totalTime = currentCase.timeLimit

  const handleReset = () => {
    resetGame()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-cold-dark py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-body font-bold glow-text text-ice-50">演练复盘</h1>
          <p className="text-ice-300 font-body mt-2 text-sm">{currentCase.title}</p>
        </motion.div>

        <motion.section
          className="card-base p-6"
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-ice-400" />
            <h2 className="text-lg font-body text-ice-200 font-medium">得分总览</h2>
          </div>
          <ScoreDisplay score={gameScore} />
        </motion.section>

        <motion.section
          className="card-base p-6"
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-lg font-body text-ice-200 font-medium mb-4">能力雷达</h2>
          <RadarChart score={gameScore} />
        </motion.section>

        <motion.section
          className="card-base p-6"
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <DecisionTimeline
            decisions={playerDecisions}
            clues={currentCase.clues}
            revealedClues={revealedClues}
            actedUponClues={actedUponClues}
            totalTime={totalTime}
            tempHistory={tempHistory}
            targetTemp={currentCase.targetTemp}
          />
        </motion.section>

        <motion.section
          className="card-base p-6"
          custom={3}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <MissedClues
            clues={currentCase.clues}
            revealedClues={revealedClues}
            actedUponClues={actedUponClues}
          />
        </motion.section>

        <motion.section
          className="card-base p-6"
          custom={4}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <OptimalComparison
            playerDecisions={playerDecisions}
            optimalDecisions={currentCase.optimalDecisions}
            totalTime={totalTime}
          />
        </motion.section>

        <motion.div
          className="text-center pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button onClick={handleReset} className="btn-ice flex items-center gap-2 mx-auto text-base">
            <RotateCcw className="w-4 h-4" />
            返回选择新案例
          </button>
        </motion.div>
      </div>
    </div>
  )
}
