import { CaseClue } from '@/types'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface Props {
  clues: CaseClue[]
  revealedClues: string[]
}

export default function MissedClues({ clues, revealedClues }: Props) {
  const missed = clues.filter(
    (c) => c.isCritical && !c.isDistraction && !revealedClues.includes(c.id)
  )

  if (missed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle className="w-10 h-10 text-safe" />
        <p className="text-safe font-body text-lg">所有关键线索均已发现！</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-danger" />
        <h3 className="text-base font-body text-danger font-medium">错失的关键线索</h3>
      </div>
      {missed.map((clue, i) => (
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
  )
}
