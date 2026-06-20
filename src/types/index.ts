export interface TemperaturePoint {
  time: number
  temperature: number
  isCritical: boolean
}

export interface CaseResource {
  id: string
  type: string
  name: string
  distance: number
  capacity: number
  cost: number
  available: boolean
}

export interface CaseClue {
  id: string
  triggerTime: number
  content: string
  isCritical: boolean
  isDistraction: boolean
  impactOnOptimal: string
}

export interface OptimalDecision {
  time: number
  type: string
  description: string
  tempImpact: number
  costImpact: number
  timeImpact: number
}

export interface WeatherInfo {
  condition: string
  temperature: number
  icon: string
}

export interface ColdChainCase {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  cargoType: string
  cargoValue: number
  targetTemp: number
  currentTemp: number
  remainingMileage: number
  weather: WeatherInfo
  availableResources: CaseResource[]
  temperatureCurve: TemperaturePoint[]
  clues: CaseClue[]
  optimalDecisions: OptimalDecision[]
  timeLimit: number
  icon: string
}

export interface PlayerDecision {
  id: string
  type: string
  description: string
  timestamp: number
  elapsedTime: number
  tempImpact: number
  resourceId?: string
  resourceAmount?: number
  costImpact?: number
}

export interface CommunicationEntry {
  id: string
  type: 'alert' | 'info' | 'decision' | 'system'
  message: string
  timestamp: number
}

export interface GameScore {
  responseSpeed: number
  temperatureRecovery: number
  resourceWaste: number
  communicationCompleteness: number
  totalScore: number
}
