import type { ColdChainCase } from '@/types'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  Thermometer,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Snowflake,
  X,
} from 'lucide-react'

interface CaseDetailProps {
  caseData: ColdChainCase
  onStart: () => void
  onClose: () => void
}

function getTempColor(current: number, target: number): string {
  const diff = Math.abs(current - target)
  if (diff <= 2) return 'text-safe'
  if (diff <= 5) return 'text-warn'
  return 'text-danger'
}

function drawTempChart(canvas: HTMLCanvasElement, curve: ColdChainCase['temperatureCurve'], targetTemp: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = canvas.offsetWidth * 2
  canvas.height = canvas.offsetHeight * 2
  ctx.scale(2, 2)
  const w = canvas.offsetWidth
  const h = canvas.offsetHeight
  const pad = { top: 20, right: 16, bottom: 28, left: 40 }
  const cw = w - pad.left - pad.right
  const ch = h - pad.top - pad.bottom

  const temps = curve.map((d) => d.temperature)
  const allTemps = [...temps, targetTemp]
  const minT = Math.min(...allTemps) - 2
  const maxT = Math.max(...allTemps) + 2
  const range = maxT - minT || 1

  const toX = (i: number) => pad.left + (i / (curve.length - 1)) * cw
  const toY = (t: number) => pad.top + ch - ((t - minT) / range) * ch

  ctx.strokeStyle = '#1a3a5c'
  ctx.lineWidth = 0.5
  ctx.setLineDash([])
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (i / 5) * ch
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(w - pad.right, y)
    ctx.stroke()
    const tVal = maxT - (i / 5) * range
    ctx.fillStyle = '#4a6a8c'
    ctx.font = '10px Orbitron'
    ctx.textAlign = 'right'
    ctx.fillText(tVal.toFixed(1), pad.left - 6, y + 3)
  }
  for (let i = 0; i < curve.length; i++) {
    const x = toX(i)
    ctx.beginPath()
    ctx.moveTo(x, pad.top)
    ctx.lineTo(x, pad.top + ch)
    ctx.stroke()
  }

  ctx.strokeStyle = '#00E676'
  ctx.setLineDash([5, 5])
  ctx.lineWidth = 1
  const targetY = toY(targetTemp)
  ctx.beginPath()
  ctx.moveTo(pad.left, targetY)
  ctx.lineTo(w - pad.right, targetY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#00E676'
  ctx.font = '9px Noto Sans SC'
  ctx.textAlign = 'left'
  ctx.fillText(`目标 ${targetTemp}°C`, w - pad.right - 60, targetY - 5)

  ctx.strokeStyle = '#00D4FF'
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.beginPath()
  curve.forEach((d, i) => {
    const x = toX(i)
    const y = toY(d.temperature)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  curve.forEach((d, i) => {
    const x = toX(i)
    const y = toY(d.temperature)
    if (d.isCritical) {
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#FF1744'
      ctx.fill()
    }
  })

  ctx.fillStyle = '#4a6a8c'
  ctx.font = '9px Orbitron'
  ctx.textAlign = 'center'
  curve.forEach((d, i) => {
    if (i % Math.ceil(curve.length / 6) === 0) {
      const x = toX(i)
      ctx.fillText(`${d.time}'`, x, h - pad.bottom + 16)
    }
  })
}

const resourceTypeLabel: Record<string, string> = {
  recharge_point: '补冷站',
  cold_storage: '冷库',
  dry_ice: '干冰',
}

export default function CaseDetail({ caseData, onStart, onClose }: CaseDetailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      drawTempChart(canvasRef.current, caseData.temperatureCurve, caseData.targetTemp)
    }
  }, [caseData])

  return (
    <motion.div
      className="fixed top-0 right-0 h-full w-[420px] bg-cold-panel border-l border-cold-border z-50 flex flex-col overflow-hidden"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-cold-border">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{caseData.icon}</span>
          <h2 className="font-orbitron text-lg text-ice-100 font-semibold">{caseData.title}</h2>
        </div>
        <button onClick={onClose} className="text-ice-300/50 hover:text-ice-100 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 font-body">
        <section>
          <h3 className="text-sm text-ice-300/60 mb-1.5 flex items-center gap-1.5">
            <Snowflake size={14} /> 场景概述
          </h3>
          <p className="text-sm text-ice-100/90 leading-relaxed">{caseData.description}</p>
        </section>

        <section>
          <h3 className="text-sm text-ice-300/60 mb-2 flex items-center gap-1.5">
            <Thermometer size={14} /> 货物信息
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-cold-card rounded px-3 py-2">
              <span className="text-ice-300/50 text-xs">货物类型</span>
              <p className="text-ice-100">{caseData.cargoType}</p>
            </div>
            <div className="bg-cold-card rounded px-3 py-2">
              <span className="text-ice-300/50 text-xs">货物价值</span>
              <p className="text-ice-100 font-orbitron">¥{(caseData.cargoValue / 10000).toFixed(0)}万</p>
            </div>
            <div className="bg-cold-card rounded px-3 py-2">
              <span className="text-ice-300/50 text-xs">目标温度</span>
              <p className="text-safe font-orbitron">{caseData.targetTemp}°C</p>
            </div>
            <div className="bg-cold-card rounded px-3 py-2">
              <span className="text-ice-300/50 text-xs">当前温度</span>
              <p className={`font-orbitron ${getTempColor(caseData.currentTemp, caseData.targetTemp)}`}>
                {caseData.currentTemp}°C
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm text-ice-300/60 mb-2 flex items-center gap-1.5">
            <MapPin size={14} /> 环境信息
          </h3>
          <div className="flex gap-3 text-sm">
            <div className="bg-cold-card rounded px-3 py-2 flex-1 flex items-center gap-2">
              <span className="text-xl">{caseData.weather.icon}</span>
              <div>
                <span className="text-ice-100">{caseData.weather.condition}</span>
                <p className="text-ice-300/50 text-xs font-orbitron">{caseData.weather.temperature}°C</p>
              </div>
            </div>
            <div className="bg-cold-card rounded px-3 py-2 flex-1 flex items-center gap-2">
              <Truck size={16} className="text-ice-300/50 shrink-0" />
              <div>
                <span className="text-ice-100">剩余里程</span>
                <p className="text-ice-300/50 text-xs font-orbitron">{caseData.remainingMileage} km</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm text-ice-300/60 mb-2 flex items-center gap-1.5">
            <Thermometer size={14} /> 温度趋势
          </h3>
          <div className="bg-cold-card rounded-lg p-2">
            <canvas ref={canvasRef} className="w-full" style={{ height: 180 }} />
          </div>
        </section>

        <section>
          <h3 className="text-sm text-ice-300/60 mb-2 flex items-center gap-1.5">
            <Clock size={14} /> 可用资源
          </h3>
          <div className="overflow-hidden rounded border border-cold-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-cold-card text-ice-300/50">
                  <th className="px-2 py-1.5 text-left font-body">名称</th>
                  <th className="px-2 py-1.5 text-left font-body">类型</th>
                  <th className="px-2 py-1.5 text-right font-body">距离</th>
                  <th className="px-2 py-1.5 text-right font-body">容量</th>
                  <th className="px-2 py-1.5 text-right font-body">费用</th>
                </tr>
              </thead>
              <tbody>
                {caseData.availableResources.map((r) => (
                  <tr key={r.id} className="border-t border-cold-border/50">
                    <td className={`px-2 py-1.5 ${r.available ? 'text-ice-100' : 'text-danger line-through'}`}>
                      {r.name}
                    </td>
                    <td className="px-2 py-1.5 text-ice-300/70">{resourceTypeLabel[r.type] || r.type}</td>
                    <td className="px-2 py-1.5 text-right font-orbitron text-ice-300/70">{r.distance}km</td>
                    <td className="px-2 py-1.5 text-right font-orbitron text-ice-300/70">{r.capacity}%</td>
                    <td className="px-2 py-1.5 text-right font-orbitron text-ice-300/70">¥{r.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="px-5 py-4 border-t border-cold-border">
        <button onClick={onStart} className="btn-ice w-full flex items-center justify-center gap-2 animate-pulse-glow">
          <DollarSign size={16} />
          开始演练
        </button>
      </div>
    </motion.div>
  )
}
