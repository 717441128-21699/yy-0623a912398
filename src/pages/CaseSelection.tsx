import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, ChevronRight, Snowflake, History, Trash2, Eye, AlertTriangle, AlertCircle, GraduationCap } from 'lucide-react'
import CaseCard from '@/components/CaseCard'
import CaseDetail from '@/components/CaseDetail'
import { PracticeRecord } from '@/types'
import { analyzeMistakes, type MistakeSummary } from '@/utils/analyzeMistakes'

type Difficulty = 'all' | 'beginner' | 'intermediate' | 'advanced'

const difficulties: { key: Difficulty; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'beginner', label: '初级' },
  { key: 'intermediate', label: '中级' },
  { key: 'advanced', label: '高级' },
]

const difficultyBadge: Record<Difficulty, string> = {
  all: '',
  beginner: 'bg-safe/20 text-safe border-safe/30',
  intermediate: 'bg-ice-500/20 text-ice-400 border-ice-500/30',
  advanced: 'bg-warn/20 text-warn border-warn/30',
}

const difficultyLabel: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

function getGrade(total: number): { grade: string; color: string } {
  if (total >= 90) return { grade: 'S', color: 'text-yellow-400' }
  if (total >= 75) return { grade: 'A', color: 'text-safe' }
  if (total >= 60) return { grade: 'B', color: 'text-ice-500' }
  if (total >= 40) return { grade: 'C', color: 'text-warn' }
  return { grade: 'D', color: 'text-danger' }
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-safe'
  if (score >= 50) return 'text-warn'
  return 'text-danger'
}

export default function CaseSelection() {
  const { allCases, selectCase, currentCase, startGame, practiceHistory, replayHistory, clearHistory } = useGameStore()
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('all')

  const filtered = difficulty === 'all' ? allCases : allCases.filter((c) => c.difficulty === difficulty)
  const recentRecords = practiceHistory.slice(0, 5)

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

  const handleReplay = (recordId: string, targetSection?: string) => {
    replayHistory(recordId, targetSection)
    navigate('/review')
  }

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有练习记录吗？此操作不可撤销。')) {
      clearHistory()
    }
  }

  return (
    <div className="min-h-screen bg-cold-dark font-body relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-ice-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-ice-500/3 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <motion.div
          className="absolute top-6 right-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => navigate('/teacher')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-ice-300/60 hover:text-ice-300 transition-colors"
          >
            <GraduationCap size={16} />
            教师模式
          </button>
        </motion.div>

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

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History size={20} className="text-ice-400" />
              <h2 className="text-lg font-body text-ice-200 font-medium">最近练习记录</h2>
            </div>
            {practiceHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-ice-300/60 hover:text-danger bg-cold-card border border-cold-border rounded-lg transition-all hover:border-danger/40"
              >
                <Trash2 size={14} />
                清空记录
              </button>
            )}
          </div>

          {recentRecords.length === 0 ? (
            <div className="card-base text-center py-12">
              <div className="text-ice-300/40 text-base">
                暂无练习记录，开始你的第一次演练吧！
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((record: PracticeRecord) => {
                const { grade, color } = getGrade(record.score.totalScore)
                const caseData = allCases.find((c) => c.id === record.caseId)
                const mistakes = caseData ? analyzeMistakes(record, caseData).slice(0, 2) : []
                return (
                  <div
                    key={record.id}
                    className="card-base p-4 flex items-center gap-4 hover:border-ice-500/40 transition-all"
                  >
                    <div className="text-3xl">{record.caseIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-body text-ice-100 font-medium truncate">
                          {record.caseTitle}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full border ${difficultyBadge[record.caseDifficulty]}`}
                        >
                          {difficultyLabel[record.caseDifficulty]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <span className="text-ice-300/50">{formatDate(record.playedAt)}</span>
                        <span className={`font-orbitron font-bold ${getScoreColor(record.score.totalScore)}`}>
                          {record.score.totalScore.toFixed(1)} 分
                        </span>
                        <span className={`px-2 py-0.5 rounded bg-cold-dark font-orbitron font-bold ${color}`}>
                          {grade}
                        </span>
                      </div>
                      {mistakes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {mistakes.map((mistake: MistakeSummary) => (
                            <button
                              key={mistake.type}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReplay(record.id, mistake.targetSectionId)
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-all ${
                                mistake.severity === 'high'
                                  ? 'border-danger/50 text-danger bg-danger/10 hover:bg-danger/20'
                                  : 'border-warn/50 text-warn bg-warn/10 hover:bg-warn/20'
                              }`}
                            >
                              {mistake.severity === 'high' ? (
                                <AlertTriangle size={10} />
                              ) : (
                                <AlertCircle size={10} />
                              )}
                              {mistake.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleReplay(record.id)}
                      className="btn-outline flex items-center gap-1.5 text-sm px-3 py-1.5 shrink-0"
                    >
                      <Eye size={15} />
                      查看复盘
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
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
