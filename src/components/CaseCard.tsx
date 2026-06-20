import type { ColdChainCase } from '@/types'
import { motion } from 'framer-motion'
import { Star, Thermometer } from 'lucide-react'

interface CaseCardProps {
  caseData: ColdChainCase
  isSelected: boolean
  onClick: () => void
}

const difficultyLabel: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

const difficultyColor: Record<string, string> = {
  beginner: 'text-safe',
  intermediate: 'text-warn',
  advanced: 'text-danger',
}

function MiniTempCurve({ data }: { data: ColdChainCase['temperatureCurve'] }) {
  if (data.length < 2) return null
  const temps = data.map((d) => d.temperature)
  const minT = Math.min(...temps)
  const maxT = Math.max(...temps)
  const range = maxT - minT || 1
  const w = 120
  const h = 48
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((d.temperature - minT) / range) * (h - 8) - 4
      return `${x},${y}`
    })
    .join(' ')
  const criticals = data
    .filter((d) => d.isCritical)
    .map((d) => {
      const i = data.indexOf(d)
      const x = (i / (data.length - 1)) * w
      const y = h - ((d.temperature - minT) / range) * (h - 8) - 4
      return { x, y }
    })
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke="#00D4FF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {criticals.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill="#FF1744" />
      ))}
    </svg>
  )
}

export default function CaseCard({ caseData, isSelected, onClick }: CaseCardProps) {
  const stars = caseData.difficulty === 'beginner' ? 1 : caseData.difficulty === 'intermediate' ? 2 : 3

  return (
    <motion.div
      className={`card-base flex items-center gap-5 p-5 cursor-pointer relative ${
        isSelected ? 'border-ice-500 glow-border' : ''
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02, borderColor: '#00D4FF' }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-ice-500/10 text-3xl shrink-0"
           style={{ boxShadow: '0 0 16px rgba(0,212,255,0.25)' }}>
        {caseData.icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-orbitron text-lg text-ice-100 font-semibold truncate">
          {caseData.title}
        </h3>
        <p className="text-sm text-ice-300/70 line-clamp-2 mt-1 font-body">
          {caseData.description}
        </p>
        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-cold-border/60 text-ice-300 font-body">
          {caseData.cargoType}
        </span>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <MiniTempCurve data={caseData.temperatureCurve} />
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < stars ? difficultyColor[caseData.difficulty] : 'text-cold-border'}
              fill={i < stars ? 'currentColor' : 'none'}
            />
          ))}
          <span className={`text-xs ml-1 font-orbitron ${difficultyColor[caseData.difficulty]}`}>
            {difficultyLabel[caseData.difficulty]}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-ice-300/60">
          <Thermometer size={12} />
          <span className="font-orbitron">{caseData.currentTemp}°C</span>
          <span className="mx-1">/</span>
          <span className="font-orbitron text-safe">{caseData.targetTemp}°C</span>
        </div>
        <div className="text-xs text-ice-300/50 font-orbitron">
          ¥{(caseData.cargoValue / 10000).toFixed(0)}万
        </div>
      </div>
    </motion.div>
  )
}
