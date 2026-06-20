import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, ChevronRight, Snowflake } from 'lucide-react'
import CaseCard from '@/components/CaseCard'
import CaseDetail from '@/components/CaseDetail'

type Difficulty = 'all' | 'beginner' | 'intermediate' | 'advanced'

const difficulties: { key: Difficulty; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'beginner', label: '初级' },
  { key: 'intermediate', label: '中级' },
  { key: 'advanced', label: '高级' },
]

export default function CaseSelection() {
  const { allCases, selectCase, currentCase, startGame } = useGameStore()
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('all')

  const filtered = difficulty === 'all' ? allCases : allCases.filter((c) => c.difficulty === difficulty)

  const handleCardClick = (caseId: string) => {
    setSelectedId(caseId)
    selectCase(caseId)
  }

  const handleStart = () => {
    startGame()
    navigate('/dispatch')
  }

  const handleClose = () => {
    setSelectedId(null)
  }

  return (
    <div className="min-h-screen bg-cold-dark font-body relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-ice-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-ice-500/3 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Snowflake size={32} className="text-ice-500" />
            <h1 className="font-orbitron text-4xl font-bold text-ice-100 glow-text tracking-wider">
              冷链补冷演练系统
            </h1>
            <Snowflake size={32} className="text-ice-500" />
          </div>
          <p className="text-ice-300/60 text-lg tracking-widest">应急调度训练平台</p>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Filter size={16} className="text-ice-300/50" />
          <span className="text-sm text-ice-300/50 mr-1">难度筛选</span>
          <div className="flex gap-1.5">
            {difficulties.map((d) => (
              <button
                key={d.key}
                onClick={() => setDifficulty(d.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  difficulty === d.key
                    ? 'bg-ice-500 text-ice-900 shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                    : 'bg-cold-card text-ice-300/70 border border-cold-border hover:border-ice-500/50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.08 }}
              >
                <CaseCard
                  caseData={c}
                  isSelected={selectedId === c.id}
                  onClick={() => handleCardClick(c.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-ice-300/40">
              暂无该难度的案例
            </div>
          )}
        </motion.div>

        {selectedId && currentCase && (
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={handleStart}
              className="btn-ice inline-flex items-center gap-2 text-base animate-pulse-glow"
            >
              进入演练
              <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedId && currentCase && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <CaseDetail
              caseData={currentCase}
              onStart={handleStart}
              onClose={handleClose}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
