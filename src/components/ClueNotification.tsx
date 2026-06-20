import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info } from 'lucide-react'
import type { CaseClue } from '@/types'

interface ClueNotificationProps {
  clues: CaseClue[]
  revealedClues: string[]
  elapsed: number
}

interface ActiveClue {
  clue: CaseClue
  revealTime: number
}

const SHOW_DURATION = 6000

export default function ClueNotification({ clues, revealedClues, elapsed }: ClueNotificationProps) {
  const [activeClues, setActiveClues] = useState<ActiveClue[]>([])

  useEffect(() => {
    const now = Date.now()
    const newlyRevealed = clues.filter((c) => revealedClues.includes(c.id))

    setActiveClues((prev) => {
      const existingIds = new Set(prev.map((a) => a.clue.id))
      const additions = newlyRevealed
        .filter((c) => !existingIds.has(c.id))
        .map((c) => ({ clue: c, revealTime: now }))

      return [...prev, ...additions].filter(
        (a) => now - a.revealTime < SHOW_DURATION
      )
    })
  }, [revealedClues, clues, elapsed])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      setActiveClues((prev) => prev.filter((a) => now - a.revealTime < SHOW_DURATION))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {activeClues.map((active) => {
          const { clue } = active
          const isCritical = clue.isCritical

          return (
            <motion.div
              key={clue.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.3 }}
              className={`panel-base p-3 border-l-4 ${
                isCritical ? 'border-l-warn' : 'border-l-ice-500'
              }`}
            >
              <div className="flex items-start gap-2">
                {isCritical ? (
                  <AlertTriangle size={14} className="text-warn mt-0.5 shrink-0" />
                ) : (
                  <Info size={14} className="text-ice-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-body ${
                      isCritical ? 'text-warn' : 'text-ice-300'
                    }`}
                  >
                    {isCritical ? '紧急线索' : '新线索'}
                  </div>
                  <div className="text-sm font-body text-ice-100 mt-0.5 leading-snug">
                    {clue.content}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
