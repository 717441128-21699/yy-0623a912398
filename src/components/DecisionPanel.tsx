import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Power, Play, Radio, Snowflake, Warehouse, MapPin, DollarSign, MessageSquare } from 'lucide-react'
import type { PlayerDecision, CaseResource, CaseClue } from '@/types'

interface DecisionPanelProps {
  onDecision: (decision: PlayerDecision) => void
  isStopped: boolean
  onStopTruck: () => void
  onResumeTruck: () => void
  resources: CaseResource[]
  usedResources: Record<string, number>
  clues: CaseClue[]
  revealedClues: string[]
  actedUponClues: string[]
}

type TabKey = 'stop' | 'recharge' | 'dry_ice' | 'cold_storage' | 'communication'

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'stop', label: '停车控制', icon: <Power size={14} /> },
  { key: 'recharge', label: '补冷站联系', icon: <Radio size={14} /> },
  { key: 'dry_ice', label: '干冰投放', icon: <Snowflake size={14} /> },
  { key: 'cold_storage', label: '冷库转仓', icon: <Warehouse size={14} /> },
  { key: 'communication', label: '客户沟通', icon: <MessageSquare size={14} /> },
]

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function DecisionPanel({
  onDecision,
  isStopped,
  onStopTruck,
  onResumeTruck,
  resources,
  usedResources,
  clues,
  revealedClues,
  actedUponClues,
}: DecisionPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('stop')
  const [dryIceAmount, setDryIceAmount] = useState(0)

  const rechargePoints = resources.filter((r) => r.type === 'recharge_point')
  const coldStorages = resources.filter((r) => r.type === 'cold_storage')
  const dryIceResource = resources.find((r) => r.type === 'dry_ice')

  const availableCommunications = clues.filter(
    (c) =>
      c.actionType === 'communication' &&
      revealedClues.includes(c.id) &&
      !actedUponClues.includes(c.id)
  )

  const getCommunicationDescription = (clue: CaseClue): string => {
    if (clue.content.includes('收货') || clue.content.includes('门店')) {
      return '确认收货时间'
    }
    if (clue.content.includes('总部') || clue.content.includes('调度')) {
      return '汇报总部'
    }
    if (clue.content.includes('保险') || clue.content.includes('理赔')) {
      return '确认保险理赔'
    }
    return '沟通确认'
  }

  const handleCommunication = (clue: CaseClue) => {
    const description = getCommunicationDescription(clue)
    onDecision({
      id: generateId(),
      type: 'communication',
      description: `${description}：${clue.content.slice(0, 20)}...`,
      timestamp: Date.now(),
      elapsedTime: 0,
      tempImpact: 0,
      costImpact: 0,
    })
  }

  const handleRecharge = (res: CaseResource) => {
    onDecision({
      id: generateId(),
      type: 'recharge',
      description: `联系${res.name}进行补冷`,
      timestamp: Date.now(),
      elapsedTime: 0,
      tempImpact: -3,
      resourceId: res.id,
      resourceAmount: 1,
      costImpact: res.cost,
    })
  }

  const handleDryIce = () => {
    if (!dryIceResource || dryIceAmount <= 0) return
    onDecision({
      id: generateId(),
      type: 'dry_ice',
      description: `投放${dryIceAmount}kg干冰辅助降温`,
      timestamp: Date.now(),
      elapsedTime: 0,
      tempImpact: -dryIceAmount * 0.1,
      resourceId: dryIceResource.id,
      resourceAmount: dryIceAmount,
      costImpact: (dryIceAmount * dryIceResource.cost) / dryIceResource.capacity,
    })
    setDryIceAmount(0)
  }

  const handleColdStorage = (res: CaseResource) => {
    onDecision({
      id: generateId(),
      type: 'cold_storage',
      description: `申请转仓至${res.name}`,
      timestamp: Date.now(),
      elapsedTime: 0,
      tempImpact: -8,
      resourceId: res.id,
      resourceAmount: 1,
      costImpact: res.cost,
    })
  }

  const getRemaining = (res: CaseResource) =>
    res.capacity - (usedResources[res.id] || 0)

  return (
    <div className="panel-base p-3">
      <div className="flex gap-1 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
              activeTab === tab.key
                ? 'bg-ice-500/20 text-ice-500 border border-ice-500/40'
                : 'text-ice-300 hover:text-ice-400 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'stop' && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div
                className={`flex items-center gap-2 text-sm font-body ${
                  isStopped ? 'text-safe' : 'text-ice-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isStopped ? 'bg-safe' : 'bg-ice-500 animate-pulse-glow'
                  }`}
                />
                {isStopped ? '车辆已停止' : '车辆行驶中'}
              </div>
              {!isStopped ? (
                <button className="btn-danger flex items-center gap-2" onClick={onStopTruck}>
                  <Power size={16} />
                  停车检查
                </button>
              ) : (
                <button className="btn-ice flex items-center gap-2" onClick={onResumeTruck}>
                  <Play size={16} />
                  恢复行驶
                </button>
              )}
            </div>
          )}

          {activeTab === 'recharge' && (
            <div className="flex flex-col gap-2">
              {rechargePoints.map((res) => {
                const remaining = getRemaining(res)
                const unavailable = !res.available || remaining <= 0
                return (
                  <div
                    key={res.id}
                    className={`card-base p-2.5 flex items-center justify-between ${
                      unavailable ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ice-100 font-body truncate">{res.name}</div>
                      <div className="flex items-center gap-3 text-xs text-ice-400 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <MapPin size={10} /> {res.distance}km
                        </span>
                        <span>容量 {remaining}</span>
                        <span className="flex items-center gap-0.5">
                          <DollarSign size={10} /> ¥{res.cost}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-outline text-xs px-3 py-1 ml-2"
                      onClick={() => handleRecharge(res)}
                      disabled={unavailable}
                    >
                      联系
                    </button>
                  </div>
                )
              })}
              {rechargePoints.length === 0 && (
                <div className="text-center text-ice-400 text-sm py-4">无可用补冷站</div>
              )}
            </div>
          )}

          {activeTab === 'dry_ice' && (
            <div className="flex flex-col gap-3 py-1">
              {dryIceResource ? (
                <>
                  <div className="flex items-center justify-between text-sm font-body">
                    <span className="text-ice-300">投放量</span>
                    <span className="font-orbitron text-ice-500">{dryIceAmount} kg</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={getRemaining(dryIceResource)}
                    value={dryIceAmount}
                    onChange={(e) => setDryIceAmount(Number(e.target.value))}
                    className="w-full accent-ice-500"
                  />
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-safe">
                      预计降温: {(dryIceAmount * 0.1).toFixed(1)}°C
                    </span>
                    <span className="text-warn">
                      费用: ¥{((dryIceAmount * dryIceResource.cost) / dryIceResource.capacity).toFixed(0)}
                    </span>
                  </div>
                  <button
                    className="btn-ice text-sm flex items-center justify-center gap-2"
                    onClick={handleDryIce}
                    disabled={dryIceAmount <= 0}
                  >
                    <Snowflake size={14} />
                    投放干冰
                  </button>
                </>
              ) : (
                <div className="text-center text-ice-400 text-sm py-4">无可用干冰资源</div>
              )}
            </div>
          )}

          {activeTab === 'cold_storage' && (
            <div className="flex flex-col gap-2">
              {coldStorages.map((res) => {
                const remaining = getRemaining(res)
                const unavailable = !res.available || remaining <= 0
                return (
                  <div
                    key={res.id}
                    className={`card-base p-2.5 flex items-center justify-between ${
                      unavailable ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ice-100 font-body truncate">{res.name}</div>
                      <div className="flex items-center gap-3 text-xs text-ice-400 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <MapPin size={10} /> {res.distance}km
                        </span>
                        <span>容量 {remaining}</span>
                        <span className="flex items-center gap-0.5">
                          <DollarSign size={10} /> ¥{res.cost}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-outline text-xs px-3 py-1 ml-2"
                      onClick={() => handleColdStorage(res)}
                      disabled={unavailable}
                    >
                      申请转仓
                    </button>
                  </div>
                )
              })}
              {coldStorages.length === 0 && (
                <div className="text-center text-ice-400 text-sm py-4">无可用冷库</div>
              )}
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="flex flex-col gap-2">
              {availableCommunications.map((clue) => (
                <div
                  key={clue.id}
                  className="card-base p-2.5 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ice-100 font-body truncate">
                      {getCommunicationDescription(clue)}
                    </div>
                    <div className="text-xs text-ice-400 mt-0.5 truncate">
                      {clue.content}
                    </div>
                  </div>
                  <button
                    className="btn-outline text-xs px-3 py-1 ml-2"
                    onClick={() => handleCommunication(clue)}
                  >
                    沟通
                  </button>
                </div>
              ))}
              {availableCommunications.length === 0 && (
                <div className="text-center text-ice-400 text-sm py-4">暂无待处理的沟通事项</div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
