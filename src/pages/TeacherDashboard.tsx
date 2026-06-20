import { useState, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter,
  BarChart3,
  GitCompare,
  ArrowUp,
  ArrowDown,
  Users,
  Download,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react'
import { PracticeRecord, ColdChainCase, GameScore } from '@/types'
import { generateSummaryReportHTML } from '@/utils/exportReport'

type Difficulty = 'all' | 'beginner' | 'intermediate' | 'advanced'

const difficulties: { key: Difficulty; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'beginner', label: '初级' },
  { key: 'intermediate', label: '中级' },
  { key: 'advanced', label: '高级' },
]

const difficultyBadge: Record<string, string> = {
  beginner: 'bg-safe/20 text-safe border-safe/30',
  intermediate: 'bg-ice-500/20 text-ice-400 border-ice-500/30',
  advanced: 'bg-warn/20 text-warn border-warn/30',
}

const difficultyLabel: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

function getGrade(total: number): { grade: string; color: string; bgColor: string } {
  if (total >= 90) return { grade: 'S', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10 border-yellow-400/30' }
  if (total >= 75) return { grade: 'A', color: 'text-safe', bgColor: 'bg-safe/10 border-safe/30' }
  if (total >= 60) return { grade: 'B', color: 'text-ice-500', bgColor: 'bg-ice-500/10 border-ice-500/30' }
  if (total >= 40) return { grade: 'C', color: 'text-warn', bgColor: 'bg-warn/10 border-warn/30' }
  return { grade: 'D', color: 'text-danger', bgColor: 'bg-danger/10 border-danger/30' }
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-safe'
  if (score >= 50) return 'text-ice-500'
  return 'text-danger'
}

function getBarColor(value: number): string {
  if (value >= 70) return 'bg-safe'
  if (value >= 50) return 'bg-ice-500'
  if (value >= 30) return 'bg-warn'
  return 'bg-danger'
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getTopMistake(record: PracticeRecord, caseData: ColdChainCase | undefined): string {
  if (!caseData) return '暂无数据'
  
  const missedClues = caseData.clues.filter(
    (c) => c.isCritical && !c.isDistraction && !record.revealedClues.includes(c.id)
  )
  const revealedNotActed = caseData.clues.filter(
    (c) => c.isCritical && !c.isDistraction && record.revealedClues.includes(c.id) && !record.actedUponClues.includes(c.id)
  )

  if (missedClues.length > 0) {
    return `遗漏 ${missedClues.length} 条关键线索`
  }
  if (revealedNotActed.length > 0) {
    return `${revealedNotActed.length} 条线索未处理`
  }
  if (record.score.resourceWaste < 60) {
    return '资源利用效率低'
  }
  if (record.score.responseSpeed < 60) {
    return '响应速度较慢'
  }
  return '表现良好'
}

const dimensions: { key: keyof Omit<GameScore, 'totalScore'>; label: string }[] = [
  { key: 'responseSpeed', label: '响应速度' },
  { key: 'temperatureRecovery', label: '温度恢复' },
  { key: 'resourceWaste', label: '资源利用' },
  { key: 'communicationCompleteness', label: '沟通完整度' },
]

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { practiceHistory, allCases, replayHistory } = useGameStore()

  const [selectedCase, setSelectedCase] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<Difficulty>('all')
  const [minScore, setMinScore] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('')
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])

  const filteredRecords = useMemo(() => {
    return practiceHistory.filter((record) => {
      if (selectedCase !== 'all' && record.caseId !== selectedCase) return false
      if (difficulty !== 'all' && record.caseDifficulty !== difficulty) return false
      if (minScore && record.score.totalScore < Number(minScore)) return false
      if (maxScore && record.score.totalScore > Number(maxScore)) return false
      return true
    })
  }, [practiceHistory, selectedCase, difficulty, minScore, maxScore])

  const comparisonRecords = useMemo(() => {
    const recs = selectedRecords
      .map((id) => practiceHistory.find((r) => r.id === id))
      .filter((r): r is PracticeRecord => r !== undefined)
    return recs.sort((a, b) => a.playedAt - b.playedAt)
  }, [selectedRecords, practiceHistory])

  const canCompare = comparisonRecords.length === 2 && 
    comparisonRecords[0].caseId === comparisonRecords[1].caseId

  const handleReset = () => {
    setSelectedCase('all')
    setDifficulty('all')
    setMinScore('')
    setMaxScore('')
  }

  const handleRecordSelect = (recordId: string, record: PracticeRecord) => {
    setSelectedRecords((prev) => {
      if (prev.includes(recordId)) {
        return prev.filter((id) => id !== recordId)
      }
      if (prev.length >= 2) {
        const sameCaseRecords = prev.filter((id) => {
          const r = practiceHistory.find((pr) => pr.id === id)
          return r && r.caseId === record.caseId
        })
        if (sameCaseRecords.length === 2) {
          return [sameCaseRecords[0], recordId]
        }
        if (sameCaseRecords.length === 1) {
          return [...sameCaseRecords, recordId]
        }
        return [recordId]
      }
      if (prev.length === 1) {
        const firstRecord = practiceHistory.find((r) => r.id === prev[0])
        if (firstRecord && firstRecord.caseId !== record.caseId) {
          return [recordId]
        }
      }
      return [...prev, recordId]
    })
  }

  const handleClearComparison = () => {
    setSelectedRecords([])
  }

  const handleReplay = (recordId: string) => {
    replayHistory(recordId)
    navigate('/review')
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  const handleExportCaseSummary = (caseId: string) => {
    const caseData = allCases.find((c) => c.id === caseId)
    if (!caseData) return
    
    const records = practiceHistory.filter((r) => r.caseId === caseId)
    const html = generateSummaryReportHTML(records, caseData)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `案例汇总报告_${caseData.title}_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const caseOptions = useMemo(() => {
    const uniqueCases = new Map<string, { id: string; title: string; icon: string }>()
    practiceHistory.forEach((r) => {
      if (!uniqueCases.has(r.caseId)) {
        uniqueCases.set(r.caseId, { id: r.caseId, title: r.caseTitle, icon: r.caseIcon })
      }
    })
    return Array.from(uniqueCases.values())
  }, [practiceHistory])

  return (
    <div className="min-h-screen bg-cold-dark font-body relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-ice-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-ice-500/3 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <Users className="text-ice-400" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-ice-100 glow-text">教师工作台</h1>
              <p className="text-sm text-ice-300/60">练习记录管理</p>
            </div>
          </div>
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-4 py-2 text-sm text-ice-300 border border-cold-border rounded-lg hover:border-ice-500/50 hover:text-ice-100 transition-all"
          >
            <ChevronLeft size={16} />
            返回首页
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="card-base p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <Filter size={18} className="text-ice-400" />
                <h2 className="font-medium text-ice-200">筛选条件</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-ice-300/70 mb-2">案例筛选</label>
                  <select
                    value={selectedCase}
                    onChange={(e) => setSelectedCase(e.target.value)}
                    className="w-full bg-cold-dark border border-cold-border rounded-lg px-3 py-2 text-sm text-ice-200 focus:outline-none focus:border-ice-500 transition-colors"
                  >
                    <option value="all">全部案例</option>
                    {caseOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-ice-300/70 mb-2">难度筛选</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {difficulties.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setDifficulty(d.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          difficulty === d.key
                            ? 'bg-ice-500 text-ice-900 font-medium'
                            : 'bg-cold-dark text-ice-300/70 border border-cold-border hover:border-ice-500/50'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-ice-300/70 mb-2">分数范围</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={minScore}
                      onChange={(e) => setMinScore(e.target.value)}
                      placeholder="最低分"
                      className="flex-1 bg-cold-dark border border-cold-border rounded-lg px-3 py-2 text-sm text-ice-200 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-500 transition-colors"
                    />
                    <span className="text-ice-300/40">-</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                      placeholder="最高分"
                      className="flex-1 bg-cold-dark border border-cold-border rounded-lg px-3 py-2 text-sm text-ice-200 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-2 text-sm text-ice-300/70 border border-cold-border rounded-lg hover:border-ice-500/50 hover:text-ice-200 transition-all"
                >
                  重置筛选
                </button>
              </div>

              {selectedCase !== 'all' && (
                <div className="mt-5 pt-5 border-t border-cold-border">
                  <button
                    onClick={() => handleExportCaseSummary(selectedCase)}
                    className="w-full btn-outline flex items-center justify-center gap-2 text-sm py-2"
                  >
                    <Download size={16} />
                    导出案例汇总
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="card-base p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-ice-400" />
                    <h2 className="font-medium text-ice-200">练习记录</h2>
                    <span className="text-sm text-ice-300/50">({filteredRecords.length} 条)</span>
                  </div>
                  {selectedRecords.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-ice-300/70">
                        已选择 {selectedRecords.length} 条
                      </span>
                      {!canCompare && selectedRecords.length === 2 && (
                        <span className="text-warn text-xs flex items-center gap-1">
                          <AlertTriangle size={12} />
                          需选择同一案例
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="text-center py-16 text-ice-300/40">
                    暂无符合条件的练习记录
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {filteredRecords.map((record) => {
                      const { grade, color, bgColor } = getGrade(record.score.totalScore)
                      const caseData = allCases.find((c) => c.id === record.caseId)
                      const topMistake = getTopMistake(record, caseData)
                      const isSelected = selectedRecords.includes(record.id)

                      return (
                        <motion.div
                          key={record.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`card-base p-4 flex items-center gap-4 transition-all ${
                            isSelected ? 'border-ice-500 ring-2 ring-ice-500/30' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRecordSelect(record.id, record)}
                            className="w-5 h-5 rounded border-cold-border bg-cold-dark text-ice-500 focus:ring-ice-500/50 cursor-pointer"
                          />

                          <div className="text-3xl">{record.caseIcon}</div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-medium text-ice-100 truncate">
                                {record.caseTitle}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full border ${difficultyBadge[record.caseDifficulty]}`}
                              >
                                {difficultyLabel[record.caseDifficulty]}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-ice-300/50">{formatDate(record.playedAt)}</span>
                              <span className="text-ice-300/50 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                {topMistake}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`font-orbitron font-bold text-lg ${getScoreColor(record.score.totalScore)}`}>
                                {record.score.totalScore.toFixed(1)}
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded border ${bgColor} ${color}`}>
                                {grade}
                              </span>
                            </div>
                            <button
                              onClick={() => handleReplay(record.id)}
                              className="btn-outline flex items-center gap-1.5 text-sm px-3 py-1.5"
                            >
                              查看复盘
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {canCompare && comparisonRecords.length === 2 && (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, height: 0, y: 20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <div className="card-base p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <GitCompare size={20} className="text-ice-400" />
                        <h2 className="text-lg font-medium text-ice-200">对比分析</h2>
                        <span className="text-sm text-ice-300/50">
                          {comparisonRecords[0].caseTitle}
                        </span>
                      </div>
                      <button
                        onClick={handleClearComparison}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-ice-300/70 border border-cold-border rounded-lg hover:border-danger/50 hover:text-danger transition-all"
                      >
                        <X size={14} />
                        清除对比
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {comparisonRecords.map((record, idx) => {
                        const { grade, color, bgColor } = getGrade(record.score.totalScore)
                        return (
                          <div
                            key={record.id}
                            className={`p-5 rounded-xl border ${
                              idx === 0
                                ? 'bg-cold-panel border-cold-border'
                                : 'bg-ice-500/5 border-ice-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-ice-300/70">
                                {idx === 0 ? '较早记录' : '较新记录'}
                              </span>
                              <span className="text-xs text-ice-300/50">
                                {formatDate(record.playedAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div>
                                <div className={`text-4xl font-orbitron font-bold ${getScoreColor(record.score.totalScore)}`}>
                                  {record.score.totalScore.toFixed(1)}
                                </div>
                                <div className="text-xs text-ice-300/50 mt-1">综合得分</div>
                              </div>
                              <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${bgColor} ${color}`}>
                                {grade}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-ice-300/70 mb-4">四维能力对比</h3>
                      <div className="space-y-3">
                        {dimensions.map((dim) => {
                          const earlierVal = comparisonRecords[0].score[dim.key]
                          const laterVal = comparisonRecords[1].score[dim.key]
                          const diff = laterVal - earlierVal
                          const isImproved = diff > 0
                          const isSame = diff === 0

                          return (
                            <div key={dim.key} className="grid grid-cols-[100px_1fr_auto_1fr_100px] items-center gap-3">
                              <span className="text-sm text-ice-300/70 text-right">{dim.label}</span>
                              <div className="h-2 bg-cold-dark rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getBarColor(earlierVal)}`}
                                  style={{ width: `${earlierVal}%` }}
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                {isSame ? (
                                  <span className="text-ice-300/50 text-sm font-medium">—</span>
                                ) : (
                                  <>
                                    {isImproved ? (
                                      <ArrowUp className="text-safe" size={16} />
                                    ) : (
                                      <ArrowDown className="text-danger" size={16} />
                                    )}
                                    <span className={`text-xs font-medium ${isImproved ? 'text-safe' : 'text-danger'}`}>
                                      {isImproved ? '+' : ''}{diff.toFixed(1)}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="h-2 bg-cold-dark rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getBarColor(laterVal)}`}
                                  style={{ width: `${laterVal}%` }}
                                />
                              </div>
                              <span className="text-sm font-orbitron text-ice-200">
                                {laterVal.toFixed(1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-ice-300/70 mb-4">关键指标对比</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            label: '首次响应时间',
                            earlier: comparisonRecords[0].playerDecisions.length > 0
                              ? `${comparisonRecords[0].playerDecisions[0].elapsedTime.toFixed(0)}s`
                              : '—',
                            later: comparisonRecords[1].playerDecisions.length > 0
                              ? `${comparisonRecords[1].playerDecisions[0].elapsedTime.toFixed(0)}s`
                              : '—',
                            better: 'earlier',
                          },
                          {
                            label: '最终温度',
                            earlier: `${comparisonRecords[0].finalTemp.toFixed(1)}°C`,
                            later: `${comparisonRecords[1].finalTemp.toFixed(1)}°C`,
                            better: 'lower',
                          },
                          {
                            label: '决策数量',
                            earlier: comparisonRecords[0].playerDecisions.length,
                            later: comparisonRecords[1].playerDecisions.length,
                            better: 'neutral',
                          },
                          {
                            label: '已处理线索数',
                            earlier: comparisonRecords[0].actedUponClues.length,
                            later: comparisonRecords[1].actedUponClues.length,
                            better: 'later',
                          },
                        ].map((item) => {
                          const earlierNum = typeof item.earlier === 'number' ? item.earlier : parseFloat(item.earlier)
                          const laterNum = typeof item.later === 'number' ? item.later : parseFloat(item.later)
                          let earlierBetter = false
                          let laterBetter = false
                          if (!isNaN(earlierNum) && !isNaN(laterNum)) {
                            if (item.better === 'earlier') {
                              earlierBetter = earlierNum < laterNum
                              laterBetter = laterNum < earlierNum
                            } else if (item.better === 'later') {
                              earlierBetter = earlierNum > laterNum
                              laterBetter = laterNum > earlierNum
                            } else if (item.better === 'lower') {
                              earlierBetter = earlierNum < laterNum
                              laterBetter = laterNum < earlierNum
                            }
                          }

                          return (
                            <div key={item.label} className="bg-cold-dark rounded-lg p-3 border border-cold-border">
                              <div className="text-xs text-ice-300/50 mb-2">{item.label}</div>
                              <div className="flex items-center justify-between">
                                <span className={`font-orbitron ${earlierBetter ? 'text-safe' : 'text-ice-200'}`}>
                                  {item.earlier}
                                  {earlierBetter && <CheckCircle size={12} className="inline ml-1" />}
                                </span>
                                <span className="text-ice-300/30">→</span>
                                <span className={`font-orbitron ${laterBetter ? 'text-safe' : 'text-ice-200'}`}>
                                  {item.later}
                                  {laterBetter && <CheckCircle size={12} className="inline ml-1" />}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
