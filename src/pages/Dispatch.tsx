import { useGameStore } from '@/store/gameStore'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef, useCallback } from 'react'
import { Truck, Thermometer } from 'lucide-react'
import CountdownTimer from '@/components/CountdownTimer'
import TemperatureChart from '@/components/TemperatureChart'
import DecisionPanel from '@/components/DecisionPanel'
import ResourcePanel from '@/components/ResourcePanel'
import CommunicationLog from '@/components/CommunicationLog'
import ClueNotification from '@/components/ClueNotification'

export default function Dispatch() {
  const navigate = useNavigate()
  const store = useGameStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    currentCase,
    gamePhase,
    timeRemaining,
    currentTemp,
    tempHistory,
    isStopped,
    communications,
    revealedClues,
    usedResources,
    tick,
    makeDecision,
    stopTruck,
    resumeTruck,
  } = store

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tick()
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tick])

  useEffect(() => {
    if (gamePhase === 'review') {
      navigate('/review')
    }
  }, [gamePhase, navigate])

  const handleDecision = useCallback(
    (decision: Parameters<typeof makeDecision>[0]) => {
      makeDecision(decision)
    },
    [makeDecision]
  )

  if (!currentCase) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-ice-400 font-body">未选择案例，请返回首页选择。</div>
      </div>
    )
  }

  const isWarning = timeRemaining <= 30
  const totalTime = currentCase.timeLimit
  const elapsed = totalTime - timeRemaining

  return (
    <div className="h-screen flex overflow-hidden bg-cold-dark">
      {/* Left Column */}
      <div className="w-72 flex flex-col gap-3 p-3 border-r border-cold-border overflow-hidden">
        <div className="flex items-center gap-2 px-1">
          <Truck size={16} className="text-ice-500" />
          <span className="text-sm font-body text-ice-200 font-semibold">车辆状态</span>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              isStopped ? 'bg-safe/20 text-safe' : 'bg-ice-500/20 text-ice-400'
            }`}
          >
            {isStopped ? '已停止' : '行驶中'}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <CommunicationLog communications={communications} />
        </div>
      </div>

      {/* Center Column */}
      <div className="flex-1 flex flex-col gap-3 p-3 overflow-hidden">
        <motion.div
          className={`flex items-center justify-center rounded-xl p-2 ${
            isWarning ? 'bg-danger/10 border border-danger/30' : 'bg-cold-panel border border-cold-border'
          }`}
          animate={isWarning ? { boxShadow: ['0 0 0px #FF1744', '0 0 20px #FF1744', '0 0 0px #FF1744'] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <CountdownTimer
            timeRemaining={timeRemaining}
            total={totalTime}
            isWarning={isWarning}
          />
        </motion.div>

        <div className="flex-1 min-h-0">
          <TemperatureChart
            tempHistory={tempHistory}
            targetTemp={currentCase.targetTemp}
            currentTemp={currentTemp}
            timeRemaining={timeRemaining}
            totalTime={totalTime}
          />
        </div>

        <DecisionPanel
          onDecision={handleDecision}
          isStopped={isStopped}
          onStopTruck={stopTruck}
          onResumeTruck={resumeTruck}
          resources={currentCase.availableResources}
          usedResources={usedResources}
        />
      </div>

      {/* Right Column */}
      <div className="w-80 flex flex-col gap-3 p-3 border-l border-cold-border overflow-hidden">
        <ResourcePanel
          resources={currentCase.availableResources}
          usedResources={usedResources}
        />

        <div className="flex items-center gap-2 px-1 mt-1">
          <Thermometer size={16} className="text-ice-500" />
          <span className="text-sm font-body text-ice-200 font-semibold">线索通知</span>
        </div>

        <ClueNotification
          clues={currentCase.clues}
          revealedClues={revealedClues}
          elapsed={elapsed}
        />
      </div>
    </div>
  )
}
