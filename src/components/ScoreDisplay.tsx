import { GameScore } from '@/types'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award } from 'lucide-react'

interface Props {
  score: GameScore
}

function getGrade(total: number): { grade: string; color: string; glow: string } {
  if (total >= 90) return { grade: 'S', color: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(255,215,0,0.6)]' }
  if (total >= 75) return { grade: 'A', color: 'text-safe', glow: 'shadow-[0_0_15px_rgba(0,230,118,0.4)]' }
  if (total >= 60) return { grade: 'B', color: 'text-ice-500', glow: 'shadow-[0_0_15px_rgba(0,212,255,0.4)]' }
  if (total >= 40) return { grade: 'C', color: 'text-warn', glow: 'shadow-[0_0_15px_rgba(255,107,53,0.4)]' }
  return { grade: 'D', color: 'text-danger', glow: 'shadow-[0_0_15px_rgba(255,23,68,0.4)]' }
}

function getBarColor(value: number): string {
  if (value >= 70) return 'bg-safe'
  if (value >= 50) return 'bg-ice-500'
  if (value >= 30) return 'bg-warn'
  return 'bg-danger'
}

function useCountUp(target: number, duration = 60): number {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame = 0
    const animate = () => {
      frame++
      const progress = frame / duration
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))
      if (frame < duration) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return display
}

const dimensions: { key: keyof Omit<GameScore, 'totalScore'>; label: string }[] = [
  { key: 'responseSpeed', label: '响应速度' },
  { key: 'temperatureRecovery', label: '温度恢复' },
  { key: 'resourceWaste', label: '资源利用' },
  { key: 'communicationCompleteness', label: '沟通完整度' },
]

export default function ScoreDisplay({ score }: Props) {
  const displayTotal = useCountUp(Math.round(score.totalScore))
  const { grade, color, glow } = getGrade(score.totalScore)

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-end gap-4">
        <motion.span
          className="text-7xl font-orbitron glow-text text-ice-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {displayTotal}
        </motion.span>
        <span className="text-2xl text-ice-300 font-body mb-2">分</span>
        <motion.div
          className={`flex items-center justify-center w-14 h-14 rounded-lg border-2 ${color} ${glow} font-orbitron text-3xl font-bold`}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Award className="w-5 h-5 mr-0.5" />
          {grade}
        </motion.div>
      </div>

      <div className="w-full max-w-md space-y-3">
        {dimensions.map((dim, i) => {
          const value = Math.round(score[dim.key])
          return (
            <motion.div
              key={dim.key}
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
            >
              <div className="flex justify-between text-sm font-body">
                <span className="text-ice-200">{dim.label}</span>
                <span className="font-orbitron text-ice-100">{value}</span>
              </div>
              <div className="h-2 bg-cold-dark rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${getBarColor(value)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
