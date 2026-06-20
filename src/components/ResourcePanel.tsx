import { Snowflake, MapPin, DollarSign } from 'lucide-react'
import type { CaseResource } from '@/types'

interface ResourcePanelProps {
  resources: CaseResource[]
  usedResources: Record<string, number>
}

const typeLabels: Record<string, { label: string; color: string }> = {
  recharge_point: { label: '补冷站', color: 'bg-ice-500/20 text-ice-400' },
  cold_storage: { label: '冷库', color: 'bg-safe/20 text-safe' },
  dry_ice: { label: '干冰', color: 'bg-blue-500/20 text-blue-300' },
}

export default function ResourcePanel({ resources, usedResources }: ResourcePanelProps) {
  const dryIce = resources.find((r) => r.type === 'dry_ice')
  const dryIceUsed = dryIce ? usedResources[dryIce.id] || 0 : 0
  const dryIceTotal = dryIce?.capacity || 0
  const dryIcePercent = dryIceTotal > 0 ? ((dryIceTotal - dryIceUsed) / dryIceTotal) * 100 : 0

  const getRemaining = (res: CaseResource) =>
    res.capacity - (usedResources[res.id] || 0)

  return (
    <div className="panel-base p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-body text-ice-200">
        <Snowflake size={16} className="text-ice-500" />
        <span className="font-semibold">资源面板</span>
      </div>

      {dryIce && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-body">
            <span className="text-ice-300">干冰库存</span>
            <span className="text-ice-400">
              {dryIceTotal - dryIceUsed}/{dryIceTotal} kg
            </span>
          </div>
          <div className="w-full h-2 bg-cold-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-ice-500 rounded-full transition-all duration-500"
              style={{ width: `${dryIcePercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {resources.map((res) => {
          const remaining = getRemaining(res)
          const typeInfo = typeLabels[res.type] || { label: res.type, color: 'bg-gray-500/20 text-gray-400' }
          const unavailable = !res.available || remaining <= 0

          return (
            <div
              key={res.id}
              className={`card-base p-2.5 ${unavailable ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-body ${unavailable ? 'line-through text-ice-500' : 'text-ice-100'}`}>
                  {res.name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ice-400">
                <span className="flex items-center gap-0.5">
                  <MapPin size={10} /> {res.distance}km
                </span>
                <span>剩余 {remaining}</span>
                <span className="flex items-center gap-0.5">
                  <DollarSign size={10} /> ¥{res.cost}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    unavailable ? 'bg-danger' : 'bg-safe'
                  }`}
                />
                <span className="text-[10px] text-ice-500">
                  {unavailable ? '不可用' : '可用'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
