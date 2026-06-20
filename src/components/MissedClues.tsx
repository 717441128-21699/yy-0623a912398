import { CaseClue } from '@/types'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface Props {
  clues: CaseClue[]
  revealedClues: string[]
  actedUponClues: string[]
}

export default function MissedClues({ clues, revealedClues, actedUponClues }: Props) {
  const criticalClues = clues.filter((c) => c.isCritical && !c.isDistraction)
  const undiscovered = criticalClues.filter((c) => !revealedClues.includes(c.id))

  const actionClues = criticalClues.filter(
    (c) => c.responseMode === 'action' || (c.actionType && c.responseMode !== 'context')
  )
  const unhandled = actionClues.filter(
    (c) => revealedClues.includes(c.id) && !actedUponClues.includes(c.id)
  )

  if (undiscovered.length === 0 && unhandled.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle className="w-10 h-10 text-safe" />
        <p className="text-safe font-body text-lg">所有关键线索均已发现并处理！</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-ice-900/50 border border-ice-700/50">
        <Info className="w-4 h-4 text-ice-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 text-xs font-body text-ice-300 space-y-1">
          <p><span className="font-medium text-ice-200">背景信息线索（路况、天气等）：</span>看到即纳入判断</p>
          <p><span className="font-medium text-ice-200">操作线索（温度报警、资源建议等）：</span>需要执行对应操作</p>
        </div>
      </div>

      {undiscovered.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <h3 className="text-base font-body text-danger font-medium">未发现的关键线索</h3>
          </div>
          {undiscovered.map((clue, i) => (
            <motion.div
              key={clue.id}
              className="border border-danger/40 rounded-lg p-4 bg-danger/5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.1 }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-ice-100 text-sm">{clue.content}</p>
                  {clue.impactOnOptimal && (
                    <div className="mt-2 text-xs font-body text-danger/80">
                      <span className="font-medium">影响：</span>
                      {clue.impactOnOptimal}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {unhandled.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-warn" />
            <h3 className="text-base font-body text-warn font-medium">未处理的关键线索</h3>
          </div>
          {unhandled.map((clue, i) => (
            <motion.div
              key={clue.id}
              className="border border-warn/40 rounded-lg p-4 bg-warn/5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.1 }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-warn mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-ice-100 text-sm">{clue.content}</p>
                  {clue.impactOnOptimal && (
                    <div className="mt-2 text-xs font-body text-warn/80">
                      <span className="font-medium">影响：</span>
                      {clue.impactOnOptimal}
                    </div>
                  )}
                  <div className="mt-2 text-xs font-body text-ice-400">
                    <span className="font-medium">建议动作：</span>
                    {clue.actionType === 'stop' && '停车检查'}
                    {clue.actionType === 'recharge' && '联系补冷站'}
                    {clue.actionType === 'dry_ice' && '投放干冰'}
                    {clue.actionType === 'cold_storage' && '转仓冷库'}
                    {clue.actionType === 'communication' && '客户沟通'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
