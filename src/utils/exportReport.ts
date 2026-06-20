import type { PracticeRecord, ColdChainCase, PlayerDecision, OptimalDecision } from '@/types'

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

export function generateReportHTML(record: PracticeRecord, caseData: ColdChainCase): string {
  const { score } = record
  const { grade, color: gradeColor } = getGrade(score.totalScore)

  const dimensions = [
    { key: 'responseSpeed' as const, label: '响应速度' },
    { key: 'temperatureRecovery' as const, label: '温度恢复' },
    { key: 'resourceWaste' as const, label: '资源利用' },
    { key: 'communicationCompleteness' as const, label: '沟通完整度' },
  ]

  const missedClues = caseData.clues.filter(
    (c) => c.isCritical && !c.isDistraction && !record.revealedClues.includes(c.id)
  )
  const revealedNotActed = caseData.clues.filter(
    (c) => c.isCritical && !c.isDistraction && record.revealedClues.includes(c.id) && !record.actedUponClues.includes(c.id)
  )

  const tempChart = generateTempChartSVG(record.tempHistory, caseData.targetTemp)
  const recommendations = generateRecommendations(record)

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
  if (missedClues.length === 0 && revealedNotActed.length === 0) {
    clueListHTML = '<div class="empty-state">🎉 所有关键线索均已发现并正确处理！</div>'
  } else {
    const missedHTML = missedClues.map((c) => '<li class="clue-item clue-missed"><span class="status status-missed">未发现</span><div class="content">' + c.content + '</div></li>').join('')
    const unhandledHTML = revealedNotActed.map((c) => '<li class="clue-item clue-unhandled"><span class="status status-unhandled">已发现·未处理</span><div class="content">' + c.content + '</div></li>').join('')
    clueListHTML = '<ul class="clue-list">' + missedHTML + unhandledHTML + '</ul>'
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

  const css = `
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
    border: 3px solid ` + gradeColor + `;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 700;
    color: ` + gradeColor + `;
    box-shadow: 0 0 25px ` + gradeColor + `40;
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
  .clue-item .content { color: #a8c5e8; font-size: 14px; line-height: 1.6; }
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
  .footer {
    text-align: center;
    color: #547094;
    font-size: 12px;
    padding: 24px 0;
    margin-top: 16px;
  }
  @media print {
    body { padding: 20px; }
    .section { break-inside: avoid; }
  }
  `

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
        '<div class="section-title">📊 得分总览</div>' +
        '<div class="score-summary">' +
          '<div class="total-score">' +
            '<div class="number">' + score.totalScore.toFixed(1) + '</div>' +
            '<div class="label">综合得分</div>' +
          '</div>' +
          '<div class="grade-badge">' + grade + '</div>' +
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
