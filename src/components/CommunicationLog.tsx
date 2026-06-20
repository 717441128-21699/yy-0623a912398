import { useEffect, useRef } from 'react'
import { Radio } from 'lucide-react'
import type { CommunicationEntry } from '@/types'

interface CommunicationLogProps {
  communications: CommunicationEntry[]
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, '0'))
    .join(':')
}

export default function CommunicationLog({ communications }: CommunicationLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [communications.length])

  return (
    <div className="panel-base p-3 flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-sm font-body text-ice-200">
        <Radio size={16} className="text-ice-500" />
        <span className="font-semibold">通讯日志</span>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1"
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        {communications.map((entry) => (
          <EntryBubble key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function EntryBubble({ entry }: { entry: CommunicationEntry }) {
  const base = 'text-xs font-body rounded-lg px-2.5 py-1.5'

  if (entry.type === 'system') {
    return (
      <div className={`${base} text-ice-500 text-center bg-cold-dark/50 self-center max-w-[90%]`}>
        <span className="text-ice-600 mr-1">[{formatTime(entry.timestamp)}]</span>
        {entry.message}
      </div>
    )
  }

  if (entry.type === 'alert') {
    return (
      <div className={`${base} text-warn bg-cold-dark/50 self-start max-w-[90%] border-l-2 border-warn`}>
        <span className="text-ice-600 mr-1">[{formatTime(entry.timestamp)}]</span>
        {entry.message}
      </div>
    )
  }

  if (entry.type === 'decision') {
    return (
      <div className={`${base} text-ice-300 bg-cold-dark/50 self-end max-w-[90%] border-l-2 border-ice-500`}>
        <span className="text-ice-600 mr-1">[{formatTime(entry.timestamp)}]</span>
        {entry.message}
      </div>
    )
  }

  return (
    <div className={`${base} text-ice-400 bg-cold-dark/50 self-start max-w-[90%]`}>
      <span className="text-ice-600 mr-1">[{formatTime(entry.timestamp)}]</span>
      {entry.message}
    </div>
  )
}
