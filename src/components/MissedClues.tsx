import { CaseClue } from '@/types'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface Props {
  clues: CaseClue[]
  revealedClues: string[]
  actedUponClues: string[]
}

export default function MissedClues({ clues, revealedClues, actedUponClues }: Props) {
  const [contextExpanded, setContextExpanded] = useState(false)

  const criticalClues = clues.filter((c) => c.isCritical && !c.isDistraction)

  const contextClues = criticalClues.filter((c) => c.responseMode === 'context')
  const revealedContextClues = contextClues.filter((c) => revealedClues.includes(c.id))

  const actionClues = criticalClues.filter(
    (c) => c.responseMode === 'action' || (c.actionType && c.responseMode !== 'context')
  )
  const unhandledActionClues = actionClues.filter(
    (c) => revealedClues.includes(c.id) && !actedUponClues.includes(c.id)
  )
  const handledActionClues = actionClues.filter(
    (c) => revealedClues.includes(c.id) && actedUponClues.includes(c.id)
  )
  const missedActionClues = actionClues.filter((c) => !revealedClues.includes(c.id))

  const allGood = missedActionClues.length === 0 && unhandledActionClues.length === 0

  const actionTypeLabel: Record<string, string> = {
    stop: '停车检查',
    recharge: '联系补冷站',
    dry_ice: '投放干冰',
    cold_storage: '转仓冷库',
    communication: '客户沟通',
  }

  if (allGood && revealedContextClues.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle className="w-10 h-10 text-safe" />
          <p className="text-safe font-body text-lg">所有关键线索均已发现并处理！</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setContextExpanded(!contextExpanded)}
            className="flex items-center gap-2 w-full text-left"
          >
            <CheckCircle className="w-5 h-5 text-safe" />
            <h3 className="text-base font-body text-safe font-medium">
              已纳入判断的背景信息（{revealedContextClues.length}条）
            </h3>
            {contextExpanded ? (
              <ChevronUp className="w-4 h-4 text-safe ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 text-safe ml-auto" />
            )}
          </button>
          {contextExpanded && (
            <div className="space-y-2 ml-7">
              {revealedContextClues.map((clue, i) => (
                <motion.div
                  key={clue.id}
                  className="border border-safe/30 rounded-lg p-3 bg-safe/5"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-safe mt-0.5 shrink-0" />
                    <p className="font-body text-ice-100 text-sm">{clue.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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

      <div className="space-y-3">
        <button
          onClick={() => setContextExpanded(!contextExpanded)}
          className="flex items-center gap-2 w-full text-left"
        >
          <CheckCircle className="w-5 h-5 text-safe" />
          <h3 className="text-base font-body text-safe font-medium">
            已纳入判断的背景信息（{revealedContextClues.length}/{contextClues.length}条）
          </h3>
          {contextExpanded ? (
            <ChevronUp className="w-4 h-4 text-safe ml-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 text-safe ml-auto" />
          )}
        </button>
        {contextExpanded && revealedContextClues.length > 0 && (
          <div className="space-y-2 ml-7">
            {revealedContextClues.map((clue, i) => (
              <motion.div
                key={clue.id}
                className="border border-safe/30 rounded-lg p-3 bg-safe/5"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-safe mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-ice-100 text-sm">{clue.content}</p>
                    {clue.impactOnOptimal && (
                      <div className="mt-1.5 text-xs font-body text-safe/70">
                        <span className="font-medium">作用：</span>
                        {clue.impactOnOptimal}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {contextExpanded && revealedContextClues.length === 0 && (
          <div className="ml-7 text-sm text-ice-300/50">暂无已发现的背景信息线索</div>
        )}
      </div>

      {unhandledActionClues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warn" />
            <h3 className="text-base font-body text-warn font-medium">
              待处理的行动线索（{unhandledActionClues.length}条）
            </h3>
          </div>
          <div className="space-y-2 ml-7">
            {unhandledActionClues.map((clue, i) => (
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
                      <span className="font-medium text-warn">建议动作：</span>
                      {clue.actionType ? actionTypeLabel[clue.actionType] || clue.actionType : '执行对应操作'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {missedActionClues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <h3 className="text-base font-body text-danger font-medium">
              未发现的关键线索（{missedActionClues.length}条）
            </h3>
          </div>
          <div className="space-y-2 ml-7">
            {missedActionClues.map((clue, i) => (
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
                    <div className="mt-2 text-xs font-body text-ice-400">
                      <span className="font-medium text-danger">建议动作：</span>
                      {clue.actionType ? actionTypeLabel[clue.actionType] || clue.actionType : '执行对应操作'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {handledActionClues.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-cold-border">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-safe" />
            <h3 className="text-base font-body text-safe font-medium">
              已正确处理的行动线索（{handledActionClues.length}条）
            </h3>
          </div>
          <div className="space-y-2 ml-7">
            {handledActionClues.map((clue) => (
              <div
                key={clue.id}
                className="border border-safe/30 rounded-lg p-3 bg-safe/5 opacity-80"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-safe mt-0.5 shrink-0" />
                  <p className="font-body text-ice-100 text-sm">{clue.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
