import { motion } from 'framer-motion'

interface CountdownTimerProps {
  timeRemaining: number
  total: number
  isWarning: boolean
}

export default function CountdownTimer({ timeRemaining, total, isWarning }: CountdownTimerProps) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const progress = timeRemaining / total
  const strokeDashoffset = circumference * (1 - progress)

  const color = isWarning ? '#FF1744' : '#00D4FF'
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <span className="text-sm text-ice-300 font-body">剩余时间</span>

      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="4"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-orbitron text-3xl font-bold ${
              isWarning ? 'text-danger animate-flash-warning' : 'text-ice-500'
            }`}
          >
            {display}
          </span>
        </div>
      </div>

      <span
        className={`text-xs font-body ${
          isWarning ? 'text-danger animate-flash-warning' : 'text-ice-400'
        }`}
      >
        秒
      </span>
    </div>
  )
}
