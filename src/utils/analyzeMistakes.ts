import type { PracticeRecord, ColdChainCase } from '@/types'

export interface MistakeSummary {
  type: 'slow_response' | 'poor_temp_recovery' | 'resource_waste' | 'missed_clue' | 'unhandled_action_clue'
  label: string
  description: string
  severity: 'high' | 'medium' | 'low'
  targetSectionId: string
}

export function analyzeMistakes(record: PracticeRecord, caseData: ColdChainCase): MistakeSummary[] {
  const mistakes: MistakeSummary[] = []

  if (record.score.responseSpeed < 50) {
    mistakes.push({
      type: 'slow_response',
      label: '响应速度慢',
      description: '首次决策响应迟缓，未能在第一时间采取应急措施',
      severity: record.score.responseSpeed < 30 ? 'high' : 'medium',
      targetSectionId: 'decision-timeline',
    })
  }

  if (record.score.temperatureRecovery < 50) {
    mistakes.push({
      type: 'poor_temp_recovery',
      label: '温度恢复差',
      description: '最终温度距离目标温度差距较大，货物安全风险高',
      severity: record.score.temperatureRecovery < 30 ? 'high' : 'medium',
      targetSectionId: 'score-section',
    })
  }

  if (record.score.resourceWaste < 50) {
    mistakes.push({
      type: 'resource_waste',
      label: '资源浪费',
      description: '资源使用过度，成本控制不佳，性价比偏低',
      severity: record.score.resourceWaste < 30 ? 'high' : 'medium',
      targetSectionId: 'decision-comparison',
    })
  }

  const missedCriticalActionClues = caseData.clues.filter(
    (c) => c.isCritical && !c.isDistraction && c.responseMode === 'action' && !record.revealedClues.includes(c.id)
  )
  if (missedCriticalActionClues.length > 0) {
    mistakes.push({
      type: 'missed_clue',
      label: '遗漏关键行动线索',
      description: `有${missedCriticalActionClues.length}条需要采取行动的关键线索未被发现`,
      severity: missedCriticalActionClues.length >= 2 ? 'high' : 'medium',
      targetSectionId: 'missed-clues',
    })
  }

  const unhandledActionClues = caseData.clues.filter(
    (c) => c.isCritical && !c.isDistraction && c.responseMode === 'action' && record.revealedClues.includes(c.id) && !record.actedUponClues.includes(c.id)
  )
  if (unhandledActionClues.length > 0) {
    mistakes.push({
      type: 'unhandled_action_clue',
      label: '线索未处理',
      description: `有${unhandledActionClues.length}条已发现的行动线索未做对应处理`,
      severity: unhandledActionClues.length >= 2 ? 'high' : 'medium',
      targetSectionId: 'missed-clues',
    })
  }

  const order = { high: 0, medium: 1, low: 2 }
  mistakes.sort((a, b) => order[a.severity] - order[b.severity])

  return mistakes.slice(0, 3)
}
