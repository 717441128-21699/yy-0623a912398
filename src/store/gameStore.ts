import { create } from 'zustand'
import { ColdChainCase, PlayerDecision, CommunicationEntry, GameScore } from '@/types'
import { cases } from '@/data/cases'

type GamePhase = 'selection' | 'dispatch' | 'review'

interface TempRecord {
  time: number
  temp: number
}

interface GameState {
  allCases: ColdChainCase[]
  currentCase: ColdChainCase | null
  gamePhase: GamePhase
  timeRemaining: number
  isTimerRunning: boolean
  currentTemp: number
  playerDecisions: PlayerDecision[]
  communications: CommunicationEntry[]
  revealedClues: string[]
  actedUponClues: string[]
  usedResources: Record<string, number>
  isStopped: boolean
  gameScore: GameScore | null
  tempHistory: TempRecord[]

  selectCase: (caseId: string) => void
  startGame: () => void
  makeDecision: (decision: PlayerDecision) => void
  revealClue: (clueId: string) => void
  actOnClue: (clueId: string) => void
  stopTruck: () => void
  resumeTruck: () => void
  useResource: (resourceId: string, amount: number) => void
  addCommunication: (entry: CommunicationEntry) => void
  tick: () => void
  endGame: () => void
  resetGame: () => void
  calculateScore: () => GameScore
}

function interpolateTempFromCurve(
  curve: { time: number; temperature: number }[],
  elapsed: number
): number {
  if (curve.length === 0) return 0
  if (elapsed <= curve[0].time) return curve[0].temperature
  if (elapsed >= curve[curve.length - 1].time) return curve[curve.length - 1].temperature

  for (let i = 0; i < curve.length - 1; i++) {
    const curr = curve[i]
    const next = curve[i + 1]
    if (elapsed >= curr.time && elapsed < next.time) {
      const ratio = (elapsed - curr.time) / (next.time - curr.time)
      return curr.temperature + ratio * (next.temperature - curr.temperature)
    }
  }

  return curve[curve.length - 1].temperature
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useGameStore = create<GameState>((set, get) => ({
  allCases: cases,
  currentCase: null,
  gamePhase: 'selection',
  timeRemaining: 0,
  isTimerRunning: false,
  currentTemp: 0,
  playerDecisions: [],
  communications: [],
  revealedClues: [],
  actedUponClues: [],
  usedResources: {},
  isStopped: false,
  gameScore: null,
  tempHistory: [],

  selectCase: (caseId: string) => {
    const found = get().allCases.find((c) => c.id === caseId)
    if (!found) return

    set({
      currentCase: found,
      gamePhase: 'selection',
      timeRemaining: found.timeLimit,
      isTimerRunning: false,
      currentTemp: found.currentTemp,
      playerDecisions: [],
      communications: [],
      revealedClues: [],
      actedUponClues: [],
      usedResources: {},
      isStopped: false,
      gameScore: null,
      tempHistory: [],
    })
  },

  startGame: () => {
    const { currentCase } = get()
    if (!currentCase) return

    set({
      gamePhase: 'dispatch',
      isTimerRunning: true,
      timeRemaining: currentCase.timeLimit,
      currentTemp: currentCase.currentTemp,
      tempHistory: [{ time: 0, temp: currentCase.currentTemp }],
      playerDecisions: [],
      communications: [
        {
          id: generateId(),
          type: 'system',
          message: `任务开始：${currentCase.title}，目标温度 ${currentCase.targetTemp}°C`,
          timestamp: Date.now(),
        },
      ],
      revealedClues: [],
      actedUponClues: [],
      usedResources: {},
      isStopped: false,
      gameScore: null,
    })
  },

  makeDecision: (decision: PlayerDecision) => {
    const state = get()
    if (state.gamePhase !== 'dispatch' || !state.currentCase) return

    const decisionWithElapsed = {
      ...decision,
      elapsedTime: state.currentCase.timeLimit - state.timeRemaining,
    }

    const newTemp = state.currentTemp + decision.tempImpact

    const newCommunications = [...state.communications, {
      id: generateId(),
      type: 'decision' as const,
      message: `决策：${decision.description}（温度影响 ${decision.tempImpact > 0 ? '+' : ''}${decision.tempImpact}°C）`,
      timestamp: Date.now(),
    }]

    const newActedUponClues = [...state.actedUponClues]
    const matchingClues = state.currentCase.clues.filter(
      (c) =>
        c.isCritical &&
        !c.isDistraction &&
        c.actionType === decision.type &&
        state.revealedClues.includes(c.id) &&
        !state.actedUponClues.includes(c.id)
    )

    for (const clue of matchingClues) {
      newActedUponClues.push(clue.id)
      newCommunications.push({
        id: generateId(),
        type: 'info' as const,
        message: `已根据线索采取行动：${clue.content}`,
        timestamp: Date.now(),
      })
    }

    set({
      playerDecisions: [...state.playerDecisions, decisionWithElapsed],
      currentTemp: newTemp,
      communications: newCommunications,
      actedUponClues: newActedUponClues,
    })

    if (decision.resourceId && decision.resourceAmount) {
      get().useResource(decision.resourceId, decision.resourceAmount)
    }
  },

  actOnClue: (clueId: string) => {
    const state = get()
    if (state.actedUponClues.includes(clueId)) return

    set({
      actedUponClues: [...state.actedUponClues, clueId],
    })
  },

  revealClue: (clueId: string) => {
    const state = get()
    if (state.revealedClues.includes(clueId)) return

    const clue = state.currentCase?.clues.find((c) => c.id === clueId)
    if (!clue) return

    set({
      revealedClues: [...state.revealedClues, clueId],
      communications: [
        ...state.communications,
        {
          id: generateId(),
          type: 'alert',
          message: `线索发现：${clue.content}`,
          timestamp: Date.now(),
        },
      ],
    })
  },

  stopTruck: () => {
    const state = get()
    if (state.isStopped || state.gamePhase !== 'dispatch') return

    set({ isStopped: true })
    get().makeDecision({
      id: generateId(),
      type: 'stop',
      description: '安全停车检查，温度上升速率降低',
      timestamp: Date.now(),
      elapsedTime: 0,
      tempImpact: 0,
      costImpact: 0,
    })
  },

  resumeTruck: () => {
    const state = get()
    if (!state.isStopped || state.gamePhase !== 'dispatch') return

    set({ isStopped: false })
    get().makeDecision({
      id: generateId(),
      type: 'stop',
      description: '恢复车辆行驶',
      timestamp: Date.now(),
      elapsedTime: 0,
      tempImpact: 0,
      costImpact: 0,
    })
  },

  useResource: (resourceId: string, amount: number) => {
    set((state) => ({
      usedResources: {
        ...state.usedResources,
        [resourceId]: (state.usedResources[resourceId] || 0) + amount,
      },
    }))
  },

  addCommunication: (entry: CommunicationEntry) => {
    set((state) => ({
      communications: [...state.communications, entry],
    }))
  },

  tick: () => {
    const state = get()
    if (!state.isTimerRunning || !state.currentCase || state.gamePhase !== 'dispatch') return

    const newTimeRemaining = state.timeRemaining - 1

    if (newTimeRemaining <= 0) {
      set({ timeRemaining: 0 })
      get().endGame()
      return
    }

    const elapsed = state.currentCase.timeLimit - newTimeRemaining

    const baseTemp = interpolateTempFromCurve(state.currentCase.temperatureCurve, elapsed)
    const prevElapsed = Math.max(0, elapsed - 1)
    const prevBaseTemp = interpolateTempFromCurve(state.currentCase.temperatureCurve, prevElapsed)
    let tempDelta = baseTemp - prevBaseTemp

    if (state.isStopped) {
      tempDelta *= 0.4
    }

    let tempAdjustment = 0
    const recentDecisions = state.playerDecisions.filter(
      (d) => d.timestamp > Date.now() - 10000
    )
    for (const decision of recentDecisions) {
      const decay = Math.max(0.1, 1 - (Date.now() - decision.timestamp) / 10000)
      if (decision.type === 'dry_ice') {
        tempAdjustment += decision.tempImpact * decay * 0.15
      } else if (decision.type === 'recharge') {
        tempAdjustment += decision.tempImpact * decay * 0.1
      } else if (decision.type === 'cold_storage') {
        const targetDiff = state.currentCase!.targetTemp - state.currentTemp
        tempAdjustment += targetDiff * 0.08 * decay
      }
    }

    const newTemp = state.currentTemp + tempDelta + tempAdjustment

    const newTempHistory = [...state.tempHistory, { time: elapsed, temp: newTemp }]

    const newRevealedClues = [...state.revealedClues]
    const newCommunications = [...state.communications]
    const cluesToReveal = state.currentCase.clues.filter(
      (clue) => clue.triggerTime <= elapsed && !newRevealedClues.includes(clue.id)
    )

    for (const clue of cluesToReveal) {
      newRevealedClues.push(clue.id)
      newCommunications.push({
        id: generateId(),
        type: clue.isCritical ? 'alert' : 'info',
        message: `线索触发：${clue.content}`,
        timestamp: Date.now(),
      })
    }

    set({
      timeRemaining: newTimeRemaining,
      currentTemp: newTemp,
      tempHistory: newTempHistory,
      revealedClues: newRevealedClues,
      communications: newCommunications,
    })
  },

  endGame: () => {
    const state = get()
    const score = state.calculateScore()

    set({
      isTimerRunning: false,
      gamePhase: 'review',
      gameScore: score,
      communications: [
        ...state.communications,
        {
          id: generateId(),
          type: 'system',
          message: `任务结束！最终得分：${score.totalScore.toFixed(1)} 分`,
          timestamp: Date.now(),
        },
      ],
    })
  },

  resetGame: () => {
    set({
      currentCase: null,
      gamePhase: 'selection',
      timeRemaining: 0,
      isTimerRunning: false,
      currentTemp: 0,
      playerDecisions: [],
      communications: [],
      revealedClues: [],
      actedUponClues: [],
      usedResources: {},
      isStopped: false,
      gameScore: null,
      tempHistory: [],
    })
  },

  calculateScore: (): GameScore => {
    const state = get()
    const caseData = state.currentCase
    if (!caseData) {
      return {
        responseSpeed: 0,
        temperatureRecovery: 0,
        resourceWaste: 0,
        communicationCompleteness: 0,
        totalScore: 0,
      }
    }

    let responseSpeed = 0
    if (state.playerDecisions.length > 0) {
      const gameStartTime = state.communications[0]?.timestamp ?? Date.now()
      const firstDecisionTime = state.playerDecisions[0].timestamp
      const responseDelaySec = (firstDecisionTime - gameStartTime) / 1000
      const maxAcceptableDelay = caseData.timeLimit * 0.3
      responseSpeed = Math.max(0, Math.min(100, 100 * (1 - responseDelaySec / maxAcceptableDelay)))
    }

    let temperatureRecovery = 0
    const finalTemp = state.currentTemp
    const targetTemp = caseData.targetTemp
    const tempDiff = Math.abs(finalTemp - targetTemp)
    const tolerance = Math.abs(caseData.currentTemp - caseData.targetTemp) * 2
    temperatureRecovery = Math.max(0, Math.min(100, 100 * (1 - tempDiff / tolerance)))

    let resourceWaste = 100
    const totalResourceUsage = Object.values(state.usedResources).reduce((sum, v) => sum + v, 0)
    const maxResources = caseData.availableResources.reduce((sum, r) => sum + r.capacity, 0)
    if (maxResources > 0) {
      const usageRatio = totalResourceUsage / maxResources
      const optimalRatio = 0.25
      if (usageRatio > optimalRatio) {
        resourceWaste = Math.max(0, 100 * (1 - (usageRatio - optimalRatio) / (1 - optimalRatio)))
      }
    }

    let communicationCompleteness = 0
    const criticalClues = caseData.clues.filter((c) => c.isCritical && !c.isDistraction)
    const revealedCriticalCount = criticalClues.filter(
      (c) => state.revealedClues.includes(c.id)
    ).length
    const actedUponCriticalCount = criticalClues.filter(
      (c) => state.actedUponClues.includes(c.id)
    ).length
    if (criticalClues.length > 0) {
      const revealRatio = revealedCriticalCount / criticalClues.length
      const actionRatio = criticalClues.length > 0 ? actedUponCriticalCount / criticalClues.length : 0
      communicationCompleteness = revealRatio * 30 + actionRatio * 70
    }

    const totalScore =
      (responseSpeed + temperatureRecovery + resourceWaste + communicationCompleteness) / 4

    return {
      responseSpeed: Math.round(responseSpeed * 10) / 10,
      temperatureRecovery: Math.round(temperatureRecovery * 10) / 10,
      resourceWaste: Math.round(resourceWaste * 10) / 10,
      communicationCompleteness: Math.round(communicationCompleteness * 10) / 10,
      totalScore: Math.round(totalScore * 10) / 10,
    }
  },
}))
