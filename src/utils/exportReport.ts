import type { PracticeRecord, ColdChainCase, PlayerDecision, OptimalDecision, GameScore } from '@/types'
import { analyzeMistakes } from './analyzeMistakes'

const difficultyLabel: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

const decisionTypeLabel: Record<string, string> = {
  stop: '停车检查',
  recharge: '充电补冷',
  dry_ice: '投放干冰',
  cold_storage: '冷库暂存',
  communication: '沟通协调',
}

const dimensionLabels: Record<string, string> = {
  responseSpeed: '响应速度',
  temperatureRecovery: '温度恢复',
  resourceWaste: '资源利用',
  communicationCompleteness: '沟通完整度',
}

function getGrade(total: number): { grade: string; color: string } {
  if (total >= 90) return { grade: 'S', color: '#FFD700' }
  if (total >= 75) return { grade: 'A', color: '#00E676' }
  if (total >= 60) return { grade: 'B', color: '#00D4FF' }
  if (total >= 40) return { grade: 'C', color: '#FF6B35' }
  return { grade: 'D', color: '#FF1744' }
}

function getBarColor(value: number): string {
  if (value >= 70) return '#00E676'
  if (value >= 50) return '#00D4FF'
  if (value >= 30) return '#FF6B35'
  return '#FF1744'
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

function generateTempChartSVG(tempHistory: { time: number; temp: number }[], targetTemp: number): string {
  if (tempHistory.length === 0) return ''

  const width = 800
  const height = 250
  const padding = { top: 30, right: 30, bottom: 40, left: 50 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const times = tempHistory.map((p) => p.time)
  const temps = tempHistory.map((p) => p.temp)

  const maxTime = Math.max(...times, 1)
  const minTemp = Math.min(...temps, targetTemp) - 2
  const maxTemp = Math.max(...temps, targetTemp) + 2
  const tempRange = maxTemp - minTemp || 1

  const points = tempHistory
    .map((p) => {
      const x = padding.left + (p.time / maxTime) * chartW
      const y = padding.top + chartH - ((p.temp - minTemp) / tempRange) * chartH
      return x.toFixed(1) + ',' + y.toFixed(1)
    })
    .join(' ')

  const targetY = padding.top + chartH - ((targetTemp - minTemp) / tempRange) * chartH

  const yTicks = 5
  let yLabels = ''
  for (let i = 0; i <= yTicks; i++) {
    const val = minTemp + (i / yTicks) * tempRange
    const y = padding.top + chartH - (i / yTicks) * chartH
    yLabels += '<line x1="' + (padding.left - 5) + '" y1="' + y + '" x2="' + padding.left + '" y2="' + y + '" stroke="#3b5278" />'
    yLabels += '<text x="' + (padding.left - 8) + '" y="' + (y + 4) + '" text-anchor="end" fill="#8aa4c4" font-size="11">' + val.toFixed(0) + '°C</text>'
  }

  const xTicks = 5
  let xLabels = ''
  for (let i = 0; i <= xTicks; i++) {
    const val = (i / xTicks) * maxTime
    const x = padding.left + (i / xTicks) * chartW
    xLabels += '<line x1="' + x + '" y1="' + (padding.top + chartH) + '" x2="' + x + '" y2="' + (padding.top + chartH + 5) + '" stroke="#3b5278" />'
    xLabels += '<text x="' + x + '" y="' + (padding.top + chartH + 18) + '" text-anchor="middle" fill="#8aa4c4" font-size="11">' + val.toFixed(0) + 's</text>'
  }

  return '<svg width="100%" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="xMidYMid meet" style="max-width:100%;">' +
    '<rect x="0" y="0" width="' + width + '" height="' + height + '" fill="transparent" />' +
    '<rect x="' + padding.left + '" y="' + padding.top + '" width="' + chartW + '" height="' + chartH + '" fill="#0a1628" stroke="#1a3a5c" rx="4" />' +
    yLabels + xLabels +
    '<line x1="' + padding.left + '" y1="' + targetY + '" x2="' + (padding.left + chartW) + '" y2="' + targetY + '" stroke="#00E676" stroke-width="1.5" stroke-dasharray="6,4" />' +
    '<text x="' + (padding.left + chartW) + '" y="' + (targetY - 6) + '" text-anchor="end" fill="#00E676" font-size="11">目标 ' + targetTemp + '°C</text>' +
    '<polyline points="' + points + '" fill="none" stroke="#00D4FF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />' +
    '</svg>'
}

function generateRecommendations(record: PracticeRecord): string[] {
  const recs: string[] = []
  const { score } = record

  if (score.responseSpeed < 60) {
    recs.push('加强响应速度训练：在收到温度异常警报后应尽快采取初步行动（如停车检查、评估情况），避免等待导致温度持续恶化。')
  }
  if (score.temperatureRecovery < 60) {
    recs.push('提高温度恢复能力：合理组合使用干冰、补冷站和冷库等资源，优先选择能快速降低温度的措施，同时关注长期保温效果。')
  }
  if (score.resourceWaste < 60) {
    recs.push('优化资源利用：避免过度使用高成本资源，根据实际情况选择性价比最优的方案，在保证货物安全的前提下控制成本。')
  }
  if (score.communicationCompleteness < 60) {
    recs.push('重视线索处理：仔细阅读并评估每条线索，对关键线索要及时采取对应行动；区分干扰信息与核心线索，避免遗漏重要信息。')
  }

  if (recs.length === 0) {
    recs.push('表现优秀！各项指标均达标，继续保持良好的决策习惯，可以挑战更高难度的案例。')
  }

  return recs
}

export function generateLectureHighlights(record: PracticeRecord, caseData: ColdChainCase): string[] {
  const highlights: string[] = []
  const { score } = record

  const dimensionScores = [
    { key: 'responseSpeed', label: '响应速度', value: score.responseSpeed },
    { key: 'temperatureRecovery', label: '温度恢复', value: score.temperatureRecovery },
    { key: 'resourceWaste', label: '资源利用', value: score.resourceWaste },
    { key: 'communicationCompleteness', label: '沟通完整度', value: score.communicationCompleteness },
  ]

  const sortedDims = [...dimensionScores].sort((a, b) => a.value - b.value)
  const weakestDim = sortedDims[0]
  const strongestDim = sortedDims[sortedDims.length - 1]

  if (weakestDim.value < 70) {
    highlights.push(`【重点提升】${weakestDim.label}是本次演练的薄弱环节（得分 ${weakestDim.value.toFixed(1)}），需针对性加强训练。`)
  }

  if (strongestDim.value >= 80) {
    highlights.push(`【保持优势】${strongestDim.label}表现优异（得分 ${strongestDim.value.toFixed(1)}），继续保持良好的决策习惯。`)
  }

  const mistakes = analyzeMistakes(record, caseData)
  if (mistakes.length > 0) {
    const highSeverity = mistakes.filter((m) => m.severity === 'high')
    if (highSeverity.length > 0) {
      highlights.push(`【严重问题】存在 ${highSeverity.length} 个严重问题：${highSeverity.map((m) => m.label).join('、')}，需重点改进。`)
    } else {
      highlights.push(`【待改进】发现 ${mistakes.length} 个问题：${mistakes.map((m) => m.label).join('、')}，建议逐步优化。`)
    }
  }

  if (score.totalScore >= 85) {
    highlights.push('【综合评价】整体表现优秀，决策思路清晰，可作为示范案例进行复盘分享。')
  } else if (score.totalScore >= 70) {
    highlights.push('【综合评价】整体表现良好，在薄弱环节加强训练后有望达到优秀水平。')
  } else if (score.totalScore >= 50) {
    highlights.push('【综合评价】基础决策能力有待加强，建议从简单案例开始反复练习。')
  } else {
    highlights.push('【综合评价】需要系统学习冷链应急处理知识，建议先学习理论再进行实操训练。')
  }

  const tempDiff = Math.abs(record.finalTemp - caseData.targetTemp)
  if (tempDiff > Math.abs(caseData.currentTemp - caseData.targetTemp) * 0.5) {
    highlights.push(`【温度控制】最终温度与目标相差 ${tempDiff.toFixed(1)}°C，温度恢复效果不理想。`)
  }

  return highlights.slice(0, 5)
}

export function generateSummaryHighlights(records: PracticeRecord[], caseData?: ColdChainCase): string[] {
  const highlights: string[] = []

  if (records.length === 0) {
    return ['暂无练习记录，无法生成分析摘要。']
  }

  const avgScore = records.reduce((sum, r) => sum + r.score.totalScore, 0) / records.length
  const maxScore = Math.max(...records.map((r) => r.score.totalScore))
  const minScore = Math.min(...records.map((r) => r.score.totalScore))

  highlights.push(`【练习概况】共完成 ${records.length} 次练习，平均分 ${avgScore.toFixed(1)}，最高分 ${maxScore.toFixed(1)}，最低分 ${minScore.toFixed(1)}。`)

  const dims: (keyof Omit<GameScore, 'totalScore'>)[] = ['responseSpeed', 'temperatureRecovery', 'resourceWaste', 'communicationCompleteness']
  const dimAvgs = dims.map((dim) => ({
    dim,
    avg: records.reduce((sum, r) => sum + r.score[dim], 0) / records.length,
  }))
  dimAvgs.sort((a, b) => a.avg - b.avg)

  const weakest = dimAvgs[0]
  const strongest = dimAvgs[dimAvgs.length - 1]

  highlights.push(`【能力短板】${dimensionLabels[weakest.dim]}是整体最薄弱的维度（平均 ${weakest.avg.toFixed(1)} 分），需重点训练。`)
  highlights.push(`【优势项目】${dimensionLabels[strongest.dim]}表现最好（平均 ${strongest.avg.toFixed(1)} 分），继续保持。`)

  if (records.length >= 2) {
    const first = records[records.length - 1]
    const last = records[0]
    const scoreDiff = last.score.totalScore - first.score.totalScore
    if (scoreDiff > 5) {
      highlights.push(`【进步趋势】整体呈进步趋势，最近一次比最早一次提升了 ${scoreDiff.toFixed(1)} 分。`)
    } else if (scoreDiff < -5) {
      highlights.push(`【注意退步】最近表现有所下滑，下降了 ${Math.abs(scoreDiff).toFixed(1)} 分，需及时复盘调整。`)
    } else {
      highlights.push('【成绩稳定】整体成绩较为稳定，建议挑战更高难度或聚焦薄弱环节突破。')
    }
  }

  if (caseData) {
    const totalMistakes = records.reduce((sum, r) => sum + analyzeMistakes(r, caseData).length, 0)
    const avgMistakes = totalMistakes / records.length
    if (avgMistakes >= 2) {
      highlights.push(`【问题频度】平均每次练习出现 ${avgMistakes.toFixed(1)} 个问题，问题发生率较高，需加强基础训练。`)
    }
  }

  const gradeCounts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  records.forEach((r) => {
    const { grade } = getGrade(r.score.totalScore)
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1
  })
  const sAndACount = (gradeCounts['S'] || 0) + (gradeCounts['A'] || 0)
  const sAndARatio = sAndACount / records.length
  if (sAndARatio >= 0.6) {
    highlights.push(`【等级分布】优秀率达 ${(sAndARatio * 100).toFixed(0)}%，整体水平良好。`)
  } else if (sAndARatio >= 0.3) {
    highlights.push(`【等级分布】优秀率为 ${(sAndARatio * 100).toFixed(0)}%，仍有提升空间。`)
  } else {
    highlights.push(`【等级分布】优秀率仅 ${(sAndARatio * 100).toFixed(0)}%，需加强基础训练。`)
  }

  return highlights.slice(0, 6)
}

function getBaseCSS(): string {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #0A1628;
    color: #e6fbff;
    line-height: 1.6;
    padding: 40px 20px;
  }
  .container { max-width: 900px; margin: 0 auto; }
  .header {
    text-align: center;
    padding: 40px;
    background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,102,204,0.05));
    border: 1px solid #1a3a5c;
    border-radius: 12px;
    margin-bottom: 32px;
  }
  .header h1 {
    font-size: 28px;
    color: #00D4FF;
    margin-bottom: 12px;
    text-shadow: 0 0 20px rgba(0,212,255,0.4);
  }
  .header .case-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .header .case-icon { font-size: 36px; }
  .header .case-title { font-size: 20px; font-weight: 600; color: #e6fbff; }
  .header .meta {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    border: 1px solid;
  }
  .badge-beginner { background: rgba(0,230,118,0.1); color: #00E676; border-color: rgba(0,230,118,0.3); }
  .badge-intermediate { background: rgba(0,212,255,0.1); color: #00D4FF; border-color: rgba(0,212,255,0.3); }
  .badge-advanced { background: rgba(255,107,53,0.1); color: #FF6B35; border-color: rgba(255,107,53,0.3); }
  .badge-time { background: rgba(138,164,196,0.1); color: #8aa4c4; border-color: rgba(138,164,196,0.3); }
  .section {
    background: #0f1f38;
    border: 1px solid #1a3a5c;
    border-radius: 12px;
    padding: 28px;
    margin-bottom: 24px;
  }
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #00D4FF;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #1a3a5c;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .score-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }
  .total-score { text-align: center; }
  .total-score .number {
    font-size: 72px;
    font-weight: 700;
    color: #e6fbff;
    text-shadow: 0 0 30px rgba(0,212,255,0.3);
    line-height: 1;
  }
  .total-score .label { color: #8aa4c4; margin-top: 6px; font-size: 14px; }
  .grade-badge {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 700;
  }
  .score-table { width: 100%; border-collapse: collapse; }
  .score-table th, .score-table td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid #1a3a5c;
  }
  .score-table th { color: #8aa4c4; font-weight: 500; font-size: 13px; }
  .score-table td { font-size: 14px; }
  .bar-container {
    background: #0a1628;
    border-radius: 4px;
    height: 8px;
    overflow: hidden;
    width: 200px;
  }
  .bar-fill { height: 100%; border-radius: 4px; }
  .score-value { font-weight: 600; color: #e6fbff; font-variant-numeric: tabular-nums; }
  table.comparison { width: 100%; border-collapse: collapse; }
  table.comparison th {
    padding: 12px;
    background: #0a1628;
    color: #8aa4c4;
    font-weight: 500;
    font-size: 13px;
    text-align: left;
    border-bottom: 1px solid #1a3a5c;
  }
  .clue-list { list-style: none; }
  .clue-item {
    padding: 12px 16px;
    background: #0a1628;
    border-radius: 8px;
    margin-bottom: 10px;
    border-left: 3px solid;
  }
  .clue-missed { border-color: #FF1744; }
  .clue-unhandled { border-color: #FF6B35; }
  .clue-handled { border-color: #00E676; }
  .clue-item .status {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
  }
  .status-missed { background: rgba(255,23,68,0.15); color: #FF1744; }
  .status-unhandled { background: rgba(255,107,53,0.15); color: #FF6B35; }
  .status-handled { background: rgba(0,230,118,0.15); color: #00E676; }
  .clue-item .content { color: #a8c5e8; font-size: 14px; line-height: 1.6; }
  .clue-category { margin-bottom: 18px; }
  .clue-category-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    padding-left: 4px;
  }
  .empty-state { text-align: center; padding: 24px; color: #8aa4c4; font-size: 14px; }
  .recommendation-list { list-style: none; }
  .recommendation-item {
    padding: 14px 16px;
    background: linear-gradient(90deg, rgba(0,212,255,0.05), transparent);
    border-radius: 8px;
    margin-bottom: 10px;
    border-left: 3px solid #00D4FF;
    color: #a8c5e8;
    font-size: 14px;
    line-height: 1.7;
  }
  .highlight-list { list-style: none; }
  .highlight-item {
    padding: 12px 16px;
    background: linear-gradient(90deg, rgba(255,215,0,0.05), transparent);
    border-radius: 8px;
    margin-bottom: 8px;
    border-left: 3px solid #FFD700;
    color: #a8c5e8;
    font-size: 14px;
    line-height: 1.7;
  }
  .footer {
    text-align: center;
    color: #547094;
    font-size: 12px;
    padding: 24px 0;
    margin-top: 16px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .stat-card {
    background: #0a1628;
    border: 1px solid #1a3a5c;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }
  .stat-card .number {
    font-size: 32px;
    font-weight: 700;
    color: #00D4FF;
    line-height: 1;
    margin-bottom: 6px;
  }
  .stat-card .label {
    font-size: 12px;
    color: #8aa4c4;
  }
  .grade-distribution {
    display: flex;
    gap: 8px;
    margin: 16px 0;
    align-items: flex-end;
    height: 80px;
  }
  .grade-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
  }
  .grade-bar-fill {
    width: 100%;
    border-radius: 4px 4px 0 0;
    min-height: 4px;
  }
  .grade-bar-label {
    font-size: 11px;
    color: #8aa4c4;
  }
  .records-table { width: 100%; border-collapse: collapse; }
  .records-table th, .records-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #1a3a5c;
    font-size: 13px;
  }
  .records-table th { color: #8aa4c4; font-weight: 500; background: #0a1628; }
  .records-table tr:hover td { background: rgba(0,212,255,0.03); }
  @media print {
    body { padding: 20px; }
    .section { break-inside: avoid; }
  }
  `
}

export function generateSingleReportHTML(record: PracticeRecord, caseData: ColdChainCase): string {
  const { score } = record
  const { grade, color: gradeColor } = getGrade(score.totalScore)

  const dimensions = [
    { key: 'responseSpeed' as const, label: '响应速度' },
    { key: 'temperatureRecovery' as const, label: '温度恢复' },
    { key: 'resourceWaste' as const, label: '资源利用' },
    { key: 'communicationCompleteness' as const, label: '沟通完整度' },
  ]

  const criticalClues = caseData.clues.filter((c) => c.isCritical && !c.isDistraction)
  const contextClues = criticalClues.filter((c) => c.responseMode === 'context')
  const revealedContextClues = contextClues.filter((c) => record.revealedClues.includes(c.id))

  const actionClues = criticalClues.filter(
    (c) => c.responseMode === 'action' || (c.actionType && c.responseMode !== 'context')
  )
  const missedActionClues = actionClues.filter((c) => !record.revealedClues.includes(c.id))
  const unhandledActionClues = actionClues.filter(
    (c) => record.revealedClues.includes(c.id) && !record.actedUponClues.includes(c.id)
  )
  const handledActionClues = actionClues.filter(
    (c) => record.revealedClues.includes(c.id) && record.actedUponClues.includes(c.id)
  )

  const tempChart = generateTempChartSVG(record.tempHistory, caseData.targetTemp)
  const recommendations = generateRecommendations(record)
  const highlights = generateLectureHighlights(record, caseData)

  let decisionsHTML = ''
  if (record.playerDecisions.length === 0) {
    decisionsHTML = '<div style="color:#8aa4c4;padding:20px 0;text-align:center;">暂无决策记录</div>'
  } else {
    decisionsHTML = record.playerDecisions
      .map((d: PlayerDecision, i: number) => {
        const tempColor = d.tempImpact < 0 ? 'rgba(0,230,118,0.15);color:#00E676' : d.tempImpact > 0 ? 'rgba(255,23,68,0.15);color:#FF1744' : 'rgba(0,212,255,0.1);color:#00D4FF'
        const costHTML = d.costImpact ? '<span style="padding:2px 8px;border-radius:12px;font-size:12px;background:rgba(255,107,53,0.15);color:#FF6B35;">成本 ¥' + d.costImpact + '</span>' : ''
        return '<div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid #1a3a5c;align-items:flex-start;">' +
          '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#00D4FF,#0066cc);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#0A1628;flex-shrink:0;">' + (i + 1) + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">' +
              '<span style="color:#e6fbff;font-weight:600;">' + (decisionTypeLabel[d.type] || d.type) + '</span>' +
              '<span style="color:#8aa4c4;font-size:13px;">' + d.elapsedTime.toFixed(0) + 's</span>' +
              '<span style="padding:2px 8px;border-radius:12px;font-size:12px;background:' + tempColor + ';">温度 ' + (d.tempImpact > 0 ? '+' : '') + d.tempImpact + '°C</span>' +
              costHTML +
            '</div>' +
            '<div style="color:#a8c5e8;font-size:14px;line-height:1.6;">' + d.description + '</div>' +
          '</div>' +
        '</div>'
      })
      .join('')
  }

  const comparisonRows = caseData.optimalDecisions
    .map((opt: OptimalDecision) => {
      const playerDecision = record.playerDecisions.find(
        (pd) => pd.type === opt.type && Math.abs(pd.elapsedTime - opt.time) < 60
      )
      const playerDesc = playerDecision
        ? playerDecision.description
        : '<span style="color:#FF6B35;">未在相应时间采取同类决策</span>'
      const playerImpact = playerDecision
        ? '<span style="color:' + (playerDecision.tempImpact <= opt.tempImpact ? '#00E676' : '#FF6B35') + ';font-size:13px;">' + playerDecision.tempImpact + '°C' + (playerDecision.costImpact ? ' / ¥' + playerDecision.costImpact : '') + '</span>'
        : '<span style="color:#FF1744;">—</span>'
      return '<tr>' +
        '<td style="padding:12px;border-bottom:1px solid #1a3a5c;color:#8aa4c4;font-size:13px;vertical-align:top;">' + opt.time + 's</td>' +
        '<td style="padding:12px;border-bottom:1px solid #1a3a5c;color:#a8c5e8;font-size:13px;vertical-align:top;line-height:1.6;">' + opt.description + '</td>' +
        '<td style="padding:12px;border-bottom:1px solid #1a3a5c;color:#00E676;font-size:13px;vertical-align:top;">' + opt.tempImpact + '°C / ¥' + opt.costImpact + '</td>' +
        '<td style="padding:12px;border-bottom:1px solid #1a3a5c;color:#a8c5e8;font-size:13px;vertical-align:top;line-height:1.6;">' + playerDesc + '</td>' +
        '<td style="padding:12px;border-bottom:1px solid #1a3a5c;vertical-align:top;">' + playerImpact + '</td>' +
      '</tr>'
    })
    .join('')

  let clueListHTML = ''
  const allActionGood = missedActionClues.length === 0 && unhandledActionClues.length === 0

  const contextHTML = revealedContextClues.length > 0
    ? '<div class="clue-category"><div class="clue-category-title" style="color:#00E676;">✓ 已纳入判断的背景信息（' + revealedContextClues.length + '/' + contextClues.length + '）</div><ul class="clue-list">' +
        revealedContextClues.map((c) => '<li class="clue-item clue-handled"><span class="status status-handled">已发现</span><div class="content">' + c.content + '</div></li>').join('') +
      '</ul></div>'
    : ''

  if (allActionGood) {
    const handledHTML = handledActionClues.length > 0
      ? '<div class="clue-category"><div class="clue-category-title" style="color:#00E676;">✓ 已正确处理的行动线索（' + handledActionClues.length + '）</div><ul class="clue-list">' +
          handledActionClues.map((c) => '<li class="clue-item clue-handled"><span class="status status-handled">已处理</span><div class="content">' + c.content + '</div></li>').join('') +
        '</ul></div>'
      : ''
    clueListHTML = '<div class="empty-state">🎉 所有关键行动线索均已发现并正确处理！</div>' + contextHTML + handledHTML
  } else {
    const missedHTML = missedActionClues.length > 0
      ? '<div class="clue-category"><div class="clue-category-title" style="color:#FF1744;">⚠ 未发现的行动线索（' + missedActionClues.length + '）</div><ul class="clue-list">' +
          missedActionClues.map((c) => '<li class="clue-item clue-missed"><span class="status status-missed">未发现</span><div class="content">' + c.content + '</div></li>').join('') +
        '</ul></div>'
      : ''

    const unhandledHTML = unhandledActionClues.length > 0
      ? '<div class="clue-category"><div class="clue-category-title" style="color:#FFB300;">⚡ 待处理的行动线索（' + unhandledActionClues.length + '）</div><ul class="clue-list">' +
          unhandledActionClues.map((c) => '<li class="clue-item clue-unhandled"><span class="status status-unhandled">已发现·未处理</span><div class="content">' + c.content + '</div></li>').join('') +
        '</ul></div>'
      : ''

    const handledHTML = handledActionClues.length > 0
      ? '<div class="clue-category"><div class="clue-category-title" style="color:#00E676;">✓ 已正确处理的行动线索（' + handledActionClues.length + '）</div><ul class="clue-list" style="opacity:0.7;">' +
          handledActionClues.map((c) => '<li class="clue-item clue-handled"><span class="status status-handled">已处理</span><div class="content">' + c.content + '</div></li>').join('') +
        '</ul></div>'
      : ''

    clueListHTML =
      '<div style="padding:12px 16px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);border-radius:8px;margin-bottom:16px;">' +
        '<div style="color:#8aa4c4;font-size:13px;line-height:1.6;">' +
          '<span style="color:#00D4FF;font-weight:600;">说明：</span>' +
          '背景信息（路况、天气等）看到即纳入判断；行动线索（温度报警、资源建议等）需要执行对应操作才算处理。' +
        '</div>' +
      '</div>' +
      contextHTML + missedHTML + unhandledHTML + handledHTML
  }

  const dimensionsHTML = dimensions.map((dim) => {
    const val = score[dim.key]
    return '<tr>' +
      '<td>' + dim.label + '</td>' +
      '<td class="score-value">' + val.toFixed(1) + '</td>' +
      '<td><div class="bar-container"><div class="bar-fill" style="width:' + Math.min(100, val) + '%;background:' + getBarColor(val) + '"></div></div></td>' +
    '</tr>'
  }).join('')

  const recsHTML = recommendations.map((r) => '<li class="recommendation-item">' + r + '</li>').join('')
  const highlightsHTML = highlights.map((h) => '<li class="highlight-item">' + h + '</li>').join('')

  const css = getBaseCSS()

  const html =
    '<!DOCTYPE html>' +
    '<html lang="zh-CN">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>冷链补冷演练复盘报告 - ' + record.caseTitle + '</title>' +
    '<style>' + css + '</style>' +
    '</head>' +
    '<body>' +
    '<div class="container">' +
      '<div class="header">' +
        '<h1>冷链补冷演练复盘报告</h1>' +
        '<div class="case-info">' +
          '<span class="case-icon">' + record.caseIcon + '</span>' +
          '<span class="case-title">' + record.caseTitle + '</span>' +
        '</div>' +
        '<div class="meta">' +
          '<span class="badge badge-time">🕐 ' + formatDate(record.playedAt) + '</span>' +
          '<span class="badge badge-' + record.caseDifficulty + '">难度：' + difficultyLabel[record.caseDifficulty] + '</span>' +
          '<span class="badge badge-time">最终温度：' + record.finalTemp.toFixed(1) + '°C（目标 ' + caseData.targetTemp + '°C）</span>' +
        '</div>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📝 讲评重点</div>' +
        '<ul class="highlight-list">' + highlightsHTML + '</ul>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📊 得分总览</div>' +
        '<div class="score-summary">' +
          '<div class="total-score">' +
            '<div class="number">' + score.totalScore.toFixed(1) + '</div>' +
            '<div class="label">综合得分</div>' +
          '</div>' +
          '<div class="grade-badge" style="border: 3px solid ' + gradeColor + '; color: ' + gradeColor + '; box-shadow: 0 0 25px ' + gradeColor + '40;">' + grade + '</div>' +
        '</div>' +
        '<table class="score-table">' +
          '<thead><tr><th style="width:30%;">评估维度</th><th style="width:15%;">得分</th><th>进度</th></tr></thead>' +
          '<tbody>' + dimensionsHTML + '</tbody>' +
        '</table>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">🌡️ 温度历史</div>' +
        (tempChart || '<div class="empty-state">暂无温度数据</div>') +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">⏱️ 决策时间线</div>' +
        decisionsHTML +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">⚖️ 决策对比</div>' +
        '<table class="comparison">' +
          '<thead><tr><th style="width:80px;">时间</th><th>专家决策（参考）</th><th style="width:120px;">专家影响</th><th>你的决策</th><th style="width:140px;">你的影响</th></tr></thead>' +
          '<tbody>' + comparisonRows + '</tbody>' +
        '</table>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">⚠️ 线索处理情况</div>' +
        clueListHTML +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">💡 改进建议</div>' +
        '<ul class="recommendation-list">' + recsHTML + '</ul>' +
      '</div>' +

      '<div class="footer">冷链补冷演练系统 · 报告生成时间 ' + formatDate(Date.now()) + '</div>' +
    '</div>' +
    '</body>' +
    '</html>'

  return html
}

function getTopMistakeForReport(record: PracticeRecord, caseData: ColdChainCase): string {
  const mistakes = analyzeMistakes(record, caseData)
  if (mistakes.length > 0) {
    return mistakes[0].label
  }
  return '表现良好'
}

function generateSummaryRecommendations(records: PracticeRecord[], caseData: ColdChainCase): string[] {
  const recs: string[] = []

  if (records.length === 0) {
    recs.push('暂无练习记录，请先完成至少一次练习。')
    return recs
  }

  const dims: (keyof Omit<GameScore, 'totalScore'>)[] = ['responseSpeed', 'temperatureRecovery', 'resourceWaste', 'communicationCompleteness']
  const dimAvgs = dims.map((dim) => ({
    dim,
    label: dimensionLabels[dim],
    avg: records.reduce((sum, r) => sum + r.score[dim], 0) / records.length,
  }))
  dimAvgs.sort((a, b) => a.avg - b.avg)

  const weakest = dimAvgs[0]
  if (weakest.avg < 60) {
    if (weakest.dim === 'responseSpeed') {
      recs.push('【响应速度】整体响应偏慢，建议训练"第一时间行动"的习惯——收到警报后立即停车评估，避免等待观望。')
    } else if (weakest.dim === 'temperatureRecovery') {
      recs.push('【温度恢复】温度控制能力不足，建议系统学习各种补冷手段的效果差异和适用场景。')
    } else if (weakest.dim === 'resourceWaste') {
      recs.push('【资源利用】资源使用过度，建议培养"够用即可"的成本意识，优先选择性价比高的方案。')
    } else if (weakest.dim === 'communicationCompleteness') {
      recs.push('【沟通完整度】线索处理能力薄弱，建议加强对关键信息的敏感度和行动执行力训练。')
    }
  }

  const totalMistakes = records.reduce((sum, r) => sum + analyzeMistakes(r, caseData).length, 0)
  const avgMistakes = totalMistakes / records.length
  if (avgMistakes >= 2) {
    recs.push(`【问题频度】平均每次出现 ${avgMistakes.toFixed(1)} 个问题，建议放慢节奏，确保每个决策都经过充分思考。`)
  }

  const avgScore = records.reduce((sum, r) => sum + r.score.totalScore, 0) / records.length
  if (avgScore >= 80) {
    recs.push('【整体评价】整体表现优秀！建议挑战更高难度的案例，或尝试在更短时间内完成决策。')
  } else if (avgScore >= 65) {
    recs.push('【整体评价】基础良好，但仍有提升空间。建议针对薄弱环节进行专项训练。')
  } else {
    recs.push('【整体评价】基础能力需要加强，建议从初级案例开始反复练习，打好基础。')
  }

  if (records.length >= 3) {
    const recentThree = records.slice(0, 3)
    const recentAvg = recentThree.reduce((sum, r) => sum + r.score.totalScore, 0) / 3
    const earlierAvg = records.slice(3).reduce((sum, r) => sum + r.score.totalScore, 0) / Math.max(1, records.length - 3)
    if (recentAvg > earlierAvg + 5) {
      recs.push('【进步趋势】近期表现呈上升趋势，学习效果良好，继续保持！')
    }
  }

  return recs
}

export function generateSummaryReportHTML(records: PracticeRecord[], caseData: ColdChainCase): string {
  const css = getBaseCSS()

  const sortedRecords = [...records].sort((a, b) => b.playedAt - a.playedAt)

  const avgScore = records.length > 0 ? records.reduce((sum, r) => sum + r.score.totalScore, 0) / records.length : 0
  const maxScore = records.length > 0 ? Math.max(...records.map((r) => r.score.totalScore)) : 0
  const minScore = records.length > 0 ? Math.min(...records.map((r) => r.score.totalScore)) : 0

  const dims: (keyof Omit<GameScore, 'totalScore'>)[] = ['responseSpeed', 'temperatureRecovery', 'resourceWaste', 'communicationCompleteness']
  const dimAvgs = dims.map((dim) => ({
    dim,
    label: dimensionLabels[dim],
    avg: records.length > 0 ? records.reduce((sum, r) => sum + r.score[dim], 0) / records.length : 0,
  }))

  const gradeCounts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  records.forEach((r) => {
    const { grade } = getGrade(r.score.totalScore)
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1
  })

  const gradeColors: Record<string, string> = {
    S: '#FFD700',
    A: '#00E676',
    B: '#00D4FF',
    C: '#FF6B35',
    D: '#FF1744',
  }

  const maxGradeCount = Math.max(...Object.values(gradeCounts), 1)
  const gradeBarsHTML = ['S', 'A', 'B', 'C', 'D'].map((grade) => {
    const count = gradeCounts[grade] || 0
    const heightPercent = (count / maxGradeCount) * 100
    return '<div class="grade-bar">' +
      '<div class="grade-bar-fill" style="height: ' + Math.max(5, heightPercent) + '%; background: ' + gradeColors[grade] + ';"></div>' +
      '<div class="grade-bar-label">' + grade + ' (' + count + ')</div>' +
    '</div>'
  }).join('')

  const dimAvgsHTML = dimAvgs.map((d) => {
    return '<tr>' +
      '<td>' + d.label + '</td>' +
      '<td class="score-value">' + d.avg.toFixed(1) + '</td>' +
      '<td><div class="bar-container"><div class="bar-fill" style="width:' + Math.min(100, d.avg) + '%;background:' + getBarColor(d.avg) + '"></div></div></td>' +
    '</tr>'
  }).join('')

  const mistakeRanking: Record<string, number> = {}
  records.forEach((record) => {
    const mistakes = analyzeMistakes(record, caseData)
    mistakes.forEach((m) => {
      mistakeRanking[m.label] = (mistakeRanking[m.label] || 0) + 1
    })
  })

  const mistakeList = Object.entries(mistakeRanking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const mistakeHTML = mistakeList.length > 0
    ? mistakeList.map(([label, count]) => 
        '<li class="clue-item clue-missed"><span class="status status-missed">' + count + ' 次</span><div class="content">' + label + '</div></li>'
      ).join('')
    : '<div class="empty-state">所有练习均表现良好！</div>'

  const highlights = generateSummaryHighlights(records, caseData)
  const highlightsHTML = highlights.map((h) => '<li class="highlight-item">' + h + '</li>').join('')

  const recordsHTML = sortedRecords.map((r, i) => {
    const { grade, color: gradeColor } = getGrade(r.score.totalScore)
    const topMistake = getTopMistakeForReport(r, caseData)
    return '<tr>' +
      '<td style="color:#8aa4c4;">#' + (i + 1) + '</td>' +
      '<td>' + formatDate(r.playedAt) + '</td>' +
      '<td class="score-value">' + r.score.totalScore.toFixed(1) + '</td>' +
      '<td><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:4px;border:1px solid ' + gradeColor + ';color:' + gradeColor + ';font-weight:bold;font-size:12px;">' + grade + '</span></td>' +
      '<td style="color:#a8c5e8;">' + topMistake + '</td>' +
    '</tr>'
  }).join('')

  const recommendations = generateSummaryRecommendations(records, caseData)
  const recsHTML = recommendations.map((r) => '<li class="recommendation-item">' + r + '</li>').join('')

  const html =
    '<!DOCTYPE html>' +
    '<html lang="zh-CN">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>案例汇总分析报告 - ' + caseData.title + '</title>' +
    '<style>' + css + '</style>' +
    '</head>' +
    '<body>' +
    '<div class="container">' +
      '<div class="header">' +
        '<h1>案例汇总分析报告</h1>' +
        '<div class="case-info">' +
          '<span class="case-icon">' + caseData.icon + '</span>' +
          '<span class="case-title">' + caseData.title + '</span>' +
        '</div>' +
        '<div class="meta">' +
          '<span class="badge badge-' + caseData.difficulty + '">难度：' + difficultyLabel[caseData.difficulty] + '</span>' +
          '<span class="badge badge-time">练习次数：' + records.length + ' 次</span>' +
          '<span class="badge badge-time">生成时间：' + formatDate(Date.now()) + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📊 分析摘要</div>' +
        '<ul class="highlight-list">' + highlightsHTML + '</ul>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📈 统计概览</div>' +
        '<div class="stats-grid">' +
          '<div class="stat-card"><div class="number">' + records.length + '</div><div class="label">练习次数</div></div>' +
          '<div class="stat-card"><div class="number" style="color:#00E676;">' + avgScore.toFixed(1) + '</div><div class="label">平均分</div></div>' +
          '<div class="stat-card"><div class="number" style="color:#FFD700;">' + maxScore.toFixed(1) + '</div><div class="label">最高分</div></div>' +
          '<div class="stat-card"><div class="number" style="color:#FF6B35;">' + minScore.toFixed(1) + '</div><div class="label">最低分</div></div>' +
        '</div>' +
        '<div style="margin-top:8px;"><span style="color:#8aa4c4;font-size:13px;">等级分布：</span></div>' +
        '<div class="grade-distribution">' + gradeBarsHTML + '</div>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📐 维度平均分</div>' +
        '<table class="score-table">' +
          '<thead><tr><th style="width:30%;">评估维度</th><th style="width:15%;">平均分</th><th>进度</th></tr></thead>' +
          '<tbody>' + dimAvgsHTML + '</tbody>' +
        '</table>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">⚠️ 常见错误排行</div>' +
        '<ul class="clue-list">' + mistakeHTML + '</ul>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📋 练习记录明细</div>' +
        '<table class="records-table">' +
          '<thead><tr><th style="width:50px;">序号</th><th>练习时间</th><th style="width:80px;">得分</th><th style="width:50px;">等级</th><th>主要问题</th></tr></thead>' +
          '<tbody>' + recordsHTML + '</tbody>' +
        '</table>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">💡 整体改进建议</div>' +
        '<ul class="recommendation-list">' + recsHTML + '</ul>' +
      '</div>' +

      '<div class="footer">冷链补冷演练系统 · 报告生成时间 ' + formatDate(Date.now()) + '</div>' +
    '</div>' +
    '</body>' +
    '</html>'

  return html
}

export function generateRecentSummaryHTML(records: PracticeRecord[], allCases: ColdChainCase[]): string {
  const css = getBaseCSS()

  const avgScore = records.length > 0 ? records.reduce((sum, r) => sum + r.score.totalScore, 0) / records.length : 0
  const maxScore = records.length > 0 ? Math.max(...records.map((r) => r.score.totalScore)) : 0

  const caseBreakdown: Record<string, { count: number; avgScore: number; title: string; icon: string }> = {}
  records.forEach((r) => {
    if (!caseBreakdown[r.caseId]) {
      const caseData = allCases.find((c) => c.id === r.caseId)
      caseBreakdown[r.caseId] = {
        count: 0,
        avgScore: 0,
        title: caseData?.title || r.caseTitle,
        icon: caseData?.icon || r.caseIcon,
      }
    }
    caseBreakdown[r.caseId].count++
    caseBreakdown[r.caseId].avgScore += r.score.totalScore
  })

  Object.keys(caseBreakdown).forEach((caseId) => {
    caseBreakdown[caseId].avgScore /= caseBreakdown[caseId].count
  })

  const caseBreakdownHTML = Object.entries(caseBreakdown)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([, data]) => {
      const { color: gradeColor } = getGrade(data.avgScore)
      return '<div class="stat-card" style="text-align:left;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<span style="font-size:24px;">' + data.icon + '</span>' +
          '<span style="color:#e6fbff;font-weight:600;font-size:14px;">' + data.title + '</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="color:#8aa4c4;font-size:12px;">' + data.count + ' 次练习</span>' +
          '<span style="color:' + gradeColor + ';font-weight:700;font-size:18px;">' + data.avgScore.toFixed(1) + ' 分</span>' +
        '</div>' +
      '</div>'
    })
    .join('')

  const mistakeTypes: Record<string, number> = {}
  records.forEach((record) => {
    const caseData = allCases.find((c) => c.id === record.caseId)
    if (!caseData) return
    const mistakes = analyzeMistakes(record, caseData)
    mistakes.forEach((m) => {
      mistakeTypes[m.label] = (mistakeTypes[m.label] || 0) + 1
    })
  })

  const mistakeList = Object.entries(mistakeTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const mistakeHTML = mistakeList.length > 0
    ? mistakeList.map(([type, count]) => 
        '<li class="clue-item clue-unhandled"><span class="status status-unhandled">' + count + ' 次</span><div class="content">' + type + '</div></li>'
      ).join('')
    : '<div class="empty-state">所有练习均表现良好！</div>'

  const highlights = generateSummaryHighlights(records)
  const highlightsHTML = highlights.map((h) => '<li class="highlight-item">' + h + '</li>').join('')

  const gradeCounts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  records.forEach((r) => {
    const { grade } = getGrade(r.score.totalScore)
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1
  })

  const gradeColors: Record<string, string> = {
    S: '#FFD700',
    A: '#00E676',
    B: '#00D4FF',
    C: '#FF6B35',
    D: '#FF1744',
  }

  const maxGradeCount = Math.max(...Object.values(gradeCounts), 1)
  const gradeBarsHTML = ['S', 'A', 'B', 'C', 'D'].map((grade) => {
    const count = gradeCounts[grade] || 0
    const heightPercent = (count / maxGradeCount) * 100
    return '<div class="grade-bar">' +
      '<div class="grade-bar-fill" style="height: ' + Math.max(5, heightPercent) + '%; background: ' + gradeColors[grade] + ';"></div>' +
      '<div class="grade-bar-label">' + grade + ' (' + count + ')</div>' +
    '</div>'
  }).join('')

  const recommendations: string[] = []
  if (avgScore >= 75) {
    recommendations.push('整体练习效果良好，建议继续保持训练频率，逐步挑战更高难度的案例。')
  } else if (avgScore >= 60) {
    recommendations.push('基础能力尚可，但优秀率偏低，建议针对薄弱案例进行专项强化训练。')
  } else {
    recommendations.push('整体水平有待提高，建议从初级案例开始系统学习，打好基础后再逐步提升难度。')
  }

  const weakestCase = Object.entries(caseBreakdown).sort((a, b) => a[1].avgScore - b[1].avgScore)[0]
  if (weakestCase && weakestCase[1].avgScore < 65) {
    recommendations.push(`「${weakestCase[1].title}」是最弱的案例（平均 ${weakestCase[1].avgScore.toFixed(1)} 分），建议重点复习该案例的知识点。`)
  }

  if (mistakeList.length > 0) {
    recommendations.push(`最常见的问题类型是「${mistakeList[0][0]}」，建议在训练中重点关注这方面的改进。`)
  }

  const recsHTML = recommendations.map((r) => '<li class="recommendation-item">' + r + '</li>').join('')

  const html =
    '<!DOCTYPE html>' +
    '<html lang="zh-CN">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>近期练习汇总报告</title>' +
    '<style>' + css + '</style>' +
    '</head>' +
    '<body>' +
    '<div class="container">' +
      '<div class="header">' +
        '<h1>近期练习汇总报告</h1>' +
        '<div class="meta">' +
          '<span class="badge badge-time">📊 共 ' + records.length + ' 条记录</span>' +
          '<span class="badge badge-time">🕐 生成时间：' + formatDate(Date.now()) + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📊 分析摘要</div>' +
        '<ul class="highlight-list">' + highlightsHTML + '</ul>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📈 总体概览</div>' +
        '<div class="stats-grid">' +
          '<div class="stat-card"><div class="number">' + records.length + '</div><div class="label">练习总数</div></div>' +
          '<div class="stat-card"><div class="number" style="color:#00E676;">' + avgScore.toFixed(1) + '</div><div class="label">平均分</div></div>' +
          '<div class="stat-card"><div class="number" style="color:#FFD700;">' + maxScore.toFixed(1) + '</div><div class="label">最高分</div></div>' +
          '<div class="stat-card"><div class="number" style="color:#00D4FF;">' + Object.keys(caseBreakdown).length + '</div><div class="label">涉及案例</div></div>' +
        '</div>' +
        '<div style="margin-top:8px;"><span style="color:#8aa4c4;font-size:13px;">等级分布：</span></div>' +
        '<div class="grade-distribution">' + gradeBarsHTML + '</div>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">📚 各案例表现</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">' +
          caseBreakdownHTML +
        '</div>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">⚠️ 高频问题类型</div>' +
        '<ul class="clue-list">' + mistakeHTML + '</ul>' +
      '</div>' +

      '<div class="section">' +
        '<div class="section-title">💡 训练建议</div>' +
        '<ul class="recommendation-list">' + recsHTML + '</ul>' +
      '</div>' +

      '<div class="footer">冷链补冷演练系统 · 报告生成时间 ' + formatDate(Date.now()) + '</div>' +
    '</div>' +
    '</body>' +
    '</html>'

  return html
}

export function generateReportHTML(record: PracticeRecord, caseData: ColdChainCase): string {
  return generateSingleReportHTML(record, caseData)
}
