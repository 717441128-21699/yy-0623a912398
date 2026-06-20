import { useGameStore } from '@/store/gameStore'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import ScoreDisplay from '@/components/ScoreDisplay'
import RadarChart from '@/components/RadarChart'
import DecisionTimeline from '@/components/DecisionTimeline'
import MissedClues from '@/components/MissedClues'
import OptimalComparison from '@/components/OptimalComparison'
import { RotateCcw, Star, Download, History, ChevronDown, FileText, TrendingUp, BarChart3 } from 'lucide-react'
import { generateSingleReportHTML, generateSummaryReportHTML, generateRecentSummaryHTML } from '@/utils/exportReport'
import { PracticeRecord } from '@/types'

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
    communications,
    currentTemp,
    replayingRecordId,
    reviewTargetSection,
    resetGame,
    practiceHistory,
    allCases,
    clearReviewTargetSection,
  } = useGameStore()

  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!currentCase || !gameScore) {
      navigate('/')
    }
  }, [currentCase, gameScore, navigate])

  useEffect(() => {
    if (reviewTargetSection) {
      const timer = setTimeout(() => {
        const el = document.getElementById(reviewTargetSection)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          el.classList.add('ring-2', 'ring-ice-400', 'ring-offset-2', 'ring-offset-cold-dark')
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-ice-400', 'ring-offset-2', 'ring-offset-cold-dark')
          }, 2500)
        }
        clearReviewTargetSection()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [reviewTargetSection, clearReviewTargetSection])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!currentCase || !gameScore) return null

  const totalTime = currentCase.timeLimit

  const handleReset = () => {
    resetGame()
    navigate('/')
  }

  const downloadHTML = (html: string, filename: string) => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportSingle = () => {
    let record: PracticeRecord

    if (replayingRecordId) {
      const found = useGameStore.getState().practiceHistory.find((r) => r.id === replayingRecordId)
      if (!found) return
      record = found
    } else {
      record = {
        id: `temp-${Date.now()}`,
        caseId: currentCase.id,
        caseTitle: currentCase.title,
        caseIcon: currentCase.icon,
        caseDifficulty: currentCase.difficulty,
        playedAt: Date.now(),
        score: gameScore,
        playerDecisions,
        revealedClues,
        actedUponClues,
        tempHistory,
        finalTemp: currentTemp,
        communications,
      }
    }

    const html = generateSingleReportHTML(record, currentCase)
    downloadHTML(html, `冷链复盘报告_${currentCase.title}_${new Date().toISOString().slice(0, 10)}.html`)
    setShowExportMenu(false)
  }

  const handleExportCaseSummary = () => {
    const records = practiceHistory.filter((r) => r.caseId === currentCase.id)
    const html = generateSummaryReportHTML(records, currentCase)
    downloadHTML(html, `案例汇总报告_${currentCase.title}_${new Date().toISOString().slice(0, 10)}.html`)
    setShowExportMenu(false)
  }

  const handleExportRecentSummary = () => {
    const recentRecords = practiceHistory.slice(0, 5)
    const html = generateRecentSummaryHTML(recentRecords, allCases)
    downloadHTML(html, `近期练习汇总_${new Date().toISOString().slice(0, 10)}.html`)
    setShowExportMenu(false)
  }

  return (
    <div className="min-h-screen bg-cold-dark py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {replayingRecordId && (
          <motion.div
            className="card-base p-4 flex items-center justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 text-ice-300">
              <History size={18} className="text-ice-400" />
              <span>
                这是历史复盘记录，ID: <code className="bg-cold-dark px-2 py-0.5 rounded text-xs">{replayingRecordId.slice(0, 8)}</code>
              </span>
            </div>
            <button onClick={handleReset} className="btn-outline flex items-center gap-1.5 text-sm px-4 py-1.5">
              <RotateCcw className="w-4 h-4" />
              返回练习
            </button>
          </motion.div>
        )}

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
          id="score-section"
          className="card-base p-6 scroll-mt-4"
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
          id="decision-timeline"
          className="card-base p-6 scroll-mt-4"
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
          id="missed-clues"
          className="card-base p-6 scroll-mt-4"
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
          id="decision-comparison"
          className="card-base p-6 scroll-mt-4"
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
          className="flex items-center justify-center gap-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-outline flex items-center gap-2 text-base"
            >
              <Download className="w-4 h-4" />
              导出报告
              <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-0 mb-2 w-56 bg-cold-card border border-cold-border rounded-lg shadow-lg overflow-hidden z-20"
                >
                  <button
                    onClick={handleExportSingle}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-ice-200 hover:bg-cold-hover transition-colors"
                  >
                    <FileText size={16} className="text-ice-400" />
                    <div>
                      <div className="font-medium">当前复盘报告</div>
                      <div className="text-xs text-ice-300/60">导出本次练习的详细报告</div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportRecentSummary}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-ice-200 hover:bg-cold-hover transition-colors border-t border-cold-border"
                  >
                    <TrendingUp size={16} className="text-ice-400" />
                    <div>
                      <div className="font-medium">最近练习汇总</div>
                      <div className="text-xs text-ice-300/60">最近 5 次练习总结</div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportCaseSummary}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-ice-200 hover:bg-cold-hover transition-colors border-t border-cold-border"
                  >
                    <BarChart3 size={16} className="text-ice-400" />
                    <div>
                      <div className="font-medium">案例汇总报告</div>
                      <div className="text-xs text-ice-300/60">本案例所有练习汇总分析</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleReset} className="btn-ice flex items-center gap-2 text-base">
            <RotateCcw className="w-4 h-4" />
            返回选择新案例
          </button>
        </motion.div>
      </div>
    </div>
  )
}
