import { PlayerDecision, OptimalDecision } from '@/types'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, BarChart3, TrendingUp } from 'lucide-react'

interface Props {
  playerDecisions: PlayerDecision[]
  optimalDecisions: OptimalDecision[]
  totalTime: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTempImpact(val: number): { text: string; color: string } {
  if (val <= -1) return { text: `${val}°C`, color: 'text-safe' }
  if (val < 0) return { text: `${val}°C`, color: 'text-safe/80' }
  if (val === 0) return { text: '0°C', color: 'text-ice-300' }
  return { text: `+${val}°C`, color: 'text-danger' }
}

function formatCostImpact(val: number): string {
  if (val === 0) return '免费'
  return `¥${val.toLocaleString()}`
}

export default function OptimalComparison({
  playerDecisions,
  optimalDecisions,
  totalTime,
}: Props) {
  const segments = optimalDecisions.map((opt) => {
    const timeWindow = totalTime * 0.1
    const nearby = playerDecisions.find((d) => {
      const elapsed = d.elapsedTime ?? 0
      return Math.abs(elapsed - opt.time) <= timeWindow && d.type === opt.type
    })
    const matches = !!nearby
    return { optimal: opt, player: nearby ?? null, matches }
  })

  const emptyPlayerSlots = playerDecisions
    .filter((d) => {
      const elapsed = d.elapsedTime ?? 0
      return !optimalDecisions.some(
        (opt) => Math.abs(elapsed - opt.time) <= totalTime * 0.1 && d.type === opt.type
      )
    })

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-ice-400" />
        <h3 className="text-base font-body text-ice-200 font-medium">决策对照</h3>
      </div>

      <div className="grid grid-cols-2 gap-0 border border-cold-border rounded-lg overflow-hidden">
        <div className="bg-ice-500/10 px-4 py-2 text-center font-body text-sm text-ice-400 border-b border-cold-border">
          你的决策
        </div>
        <div className="bg-safe/10 px-4 py-2 text-center font-body text-sm text-safe/80 border-b border-cold-border border-l border-cold-border">
          专家推荐
        </div>

        {segments.map((seg, i) => {
          const bg = i % 2 === 0 ? 'bg-transparent' : 'bg-cold-panel/50'
          return (
            <motion.div
              key={`seg-${i}`}
              className={`contents`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`px-4 py-3 ${bg} border-b border-cold-border relative`}>
                {seg.player ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-orbitron text-ice-300">
                        {formatTime(seg.optimal.time)}
                      </span>
                      {seg.matches ? (
                        <CheckCircle className="w-3.5 h-3.5 text-safe" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-warn" />
                      )}
                    </div>
                    <p className="text-sm font-body text-ice-100">{seg.player.description}</p>
                    <div className="flex gap-3 text-xs font-body">
                      <span className={formatTempImpact(seg.player.tempImpact).color}>
                        <TrendingUp className="w-3 h-3 inline mr-0.5" />
                        {formatTempImpact(seg.player.tempImpact).text}
                      </span>
                      {seg.player.costImpact !== undefined && (
                        <span className="text-ice-300">
                          {formatCostImpact(seg.player.costImpact)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-xs font-orbitron text-ice-300">
                      {formatTime(seg.optimal.time)}
                    </span>
                    <XCircle className="w-3.5 h-3.5 text-warn" />
                    <p className="text-sm font-body text-ice-300/50 italic">未操作</p>
                  </div>
                )}
              </div>
              <div className={`px-4 py-3 ${bg} border-b border-cold-border border-l border-cold-border`}>
                <div className="space-y-1">
                  <span className="text-xs font-orbitron text-safe/70">
                    {formatTime(seg.optimal.time)}
                  </span>
                  <p className="text-sm font-body text-ice-100">{seg.optimal.description}</p>
                  <div className="flex gap-3 text-xs font-body">
                    <span className={formatTempImpact(seg.optimal.tempImpact).color}>
                      <TrendingUp className="w-3 h-3 inline mr-0.5" />
                      {formatTempImpact(seg.optimal.tempImpact).text}
                    </span>
                    <span className="text-ice-300">
                      {formatCostImpact(seg.optimal.costImpact)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}

        {emptyPlayerSlots.map((d, i) => {
          const elapsed = d.elapsedTime ?? 0
          const bg = (segments.length + i) % 2 === 0 ? 'bg-transparent' : 'bg-cold-panel/50'
          return (
            <div key={`extra-${d.id}`} className={`px-4 py-3 ${bg} border-b border-cold-border border-l border-cold-border col-span-2`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-orbitron text-ice-300">{formatTime(elapsed)}</span>
                <p className="text-sm font-body text-ice-100">{d.description}</p>
                <span className={`text-xs ${formatTempImpact(d.tempImpact).color}`}>
                  {formatTempImpact(d.tempImpact).text}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
