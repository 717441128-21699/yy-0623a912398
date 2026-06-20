import { PlayerDecision, CaseClue } from '@/types'
import { useState } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  decisions: PlayerDecision[]
  clues: CaseClue[]
  revealedClues: string[]
  actedUponClues: string[]
  totalTime: number
  tempHistory: { time: number; temp: number }[]
  targetTemp: number
}

export default function DecisionTimeline({
  decisions,
  clues,
  revealedClues,
  actedUponClues,
  totalTime,
  tempHistory,
  targetTemp,
}: Props) {
  const [hoveredItem, setHoveredItem] = useState<{
    type: 'decision' | 'clue' | 'missed'
    id: string
  } | null>(null)

  const width = 900
  const height = 180
  const padX = 50
  const padY = 40
  const timelineY = 100
  const tempBarY = 50
  const usableW = width - padX * 2

  const toX = (t: number) => padX + (t / totalTime) * usableW

  const timeMarkers: number[] = []
  for (let t = 0; t <= totalTime; t += 60) {
    timeMarkers.push(t)
  }

  const criticalClues = clues.filter((c) => c.isCritical && !c.isDistraction)
  const missedClues = criticalClues.filter((c) => !revealedClues.includes(c.id))
  const revealedButUnhandled = criticalClues.filter(
    (c) => revealedClues.includes(c.id) && !actedUponClues.includes(c.id)
  )
  const revealedAndHandled = criticalClues.filter(
    (c) => revealedClues.includes(c.id) && actedUponClues.includes(c.id)
  )

  function getTempColor(temp: number): string {
    const diff = Math.abs(temp - targetTemp)
    if (diff <= 2) return '#00E676'
    if (diff <= 5) return '#FF6B35'
    return '#FF1744'
  }

  const tempPoints = tempHistory.length > 0
    ? tempHistory.map((p) => `${toX(p.time)},${tempBarY + 15 - (p.temp - targetTemp + 10) * 1.5}`).join(' ')
    : ''

  return (
    <div className="relative overflow-x-auto">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-ice-400" />
        <h3 className="text-sm font-body text-ice-200">决策时间线</h3>
      </div>
      <svg width={width} height={height} className="min-w-full">
        <line
          x1={padX}
          y1={timelineY}
          x2={width - padX}
          y2={timelineY}
          stroke="#1a3a5c"
          strokeWidth={1}
        />

        {timeMarkers.map((t) => {
          const x = toX(t)
          return (
            <g key={`tm-${t}`}>
              <line x1={x} y1={timelineY - 5} x2={x} y2={timelineY + 5} stroke="#1a3a5c" />
              <text x={x} y={timelineY + 20} textAnchor="middle" fill="#4de3ff" fontSize="10" fontFamily="Orbitron, monospace">
                {Math.floor(t / 60)}:{(t % 60).toString().padStart(2, '0')}
              </text>
            </g>
          )
        })}

        {tempHistory.length > 1 && (
          <polyline
            points={tempPoints}
            fill="none"
            stroke="#00D4FF"
            strokeWidth={1.5}
            opacity={0.5}
          />
        )}

        {tempHistory.map((p, i) => {
          if (i % 5 !== 0 && i !== tempHistory.length - 1) return null
          const x = toX(p.time)
          const ty = tempBarY + 15 - (p.temp - targetTemp + 10) * 1.5
          return (
            <circle key={`tp-${i}`} cx={x} cy={ty} r={2} fill={getTempColor(p.temp)} />
          )
        })}

        {decisions.map((d, i) => {
          const elapsed = d.elapsedTime ?? (i / decisions.length) * totalTime
          const x = toX(elapsed)
          return (
            <g
              key={`dec-${d.id}`}
              onMouseEnter={() => setHoveredItem({ type: 'decision', id: d.id })}
              onMouseLeave={() => setHoveredItem(null)}
              className="cursor-pointer"
            >
              <circle cx={x} cy={timelineY} r={6} fill="#00D4FF" stroke="#0f1f38" strokeWidth={1.5} />
              {hoveredItem?.type === 'decision' && hoveredItem.id === d.id && (
                <g>
                  <rect x={x - 80} y={timelineY - 45} width={160} height={30} rx={4} fill="#132744" stroke="#1a3a5c" />
                  <text x={x} y={timelineY - 27} textAnchor="middle" fill="#e6fbff" fontSize="10" fontFamily='"Noto Sans SC", sans-serif'>
                    {d.description.slice(0, 16)}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {revealedAndHandled.map((c) => {
          const x = toX(c.triggerTime)
          return (
            <g key={`rh-${c.id}`}>
              <polygon
                points={`${x},${timelineY - 8} ${x + 5},${timelineY} ${x},${timelineY + 8} ${x - 5},${timelineY}`}
                fill="#00E676"
                stroke="#0f1f38"
                strokeWidth={1}
              />
            </g>
          )
        })}

        {revealedButUnhandled.map((c) => {
          const x = toX(c.triggerTime)
          return (
            <g key={`ru-${c.id}`}>
              <polygon
                points={`${x},${timelineY - 8} ${x + 5},${timelineY} ${x},${timelineY + 8} ${x - 5},${timelineY}`}
                fill="#FF6B35"
                stroke="#0f1f38"
                strokeWidth={1}
              />
            </g>
          )
        })}

        {missedClues.map((c) => {
          const x = toX(c.triggerTime)
          return (
            <g key={`mc-${c.id}`}>
              <line x1={x - 4} y1={timelineY - 4} x2={x + 4} y2={timelineY + 4} stroke="#FF1744" strokeWidth={2} />
              <line x1={x + 4} y1={timelineY - 4} x2={x - 4} y2={timelineY + 4} stroke="#FF1744" strokeWidth={2} />
            </g>
          )
        })}

        <text x={padX} y={tempBarY - 5} fill="#4de3ff" fontSize="9" fontFamily='"Noto Sans SC", sans-serif'>温度曲线</text>
      </svg>

      <div className="flex flex-wrap gap-4 mt-2 text-xs font-body text-ice-300">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-ice-500" /> 决策
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-safe" /> 已处理线索
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-warn" /> 未处理线索
        </span>
        <span className="flex items-center gap-1">
          <span className="text-danger font-bold text-sm">×</span> 错失线索
        </span>
      </div>
    </div>
  )
}
