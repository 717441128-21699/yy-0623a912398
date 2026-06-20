import { useRef, useEffect, useCallback } from 'react'

interface TempRecord {
  time: number
  temp: number
}

interface TemperatureChartProps {
  tempHistory: TempRecord[]
  targetTemp: number
  currentTemp: number
  timeRemaining: number
  totalTime: number
}

export default function TemperatureChart({
  tempHistory,
  targetTemp,
  currentTemp,
  timeRemaining,
  totalTime,
}: TemperatureChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)

  const elapsed = totalTime - timeRemaining

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const pad = { top: 20, right: 20, bottom: 30, left: 50 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom

    ctx.fillStyle = '#0f1f38'
    ctx.fillRect(0, 0, w, h)

    const temps = tempHistory.map((p) => p.temp)
    const minTemp = Math.min(...temps, targetTemp) - 3
    const maxTemp = Math.max(...temps, targetTemp) + 3
    const tempRange = maxTemp - minTemp || 1

    const toX = (time: number) => pad.left + (time / (totalTime || 1)) * chartW
    const toY = (temp: number) => pad.top + (1 - (temp - minTemp) / tempRange) * chartH

    ctx.strokeStyle = '#1a3a5c'
    ctx.lineWidth = 0.5
    const gridCountY = 6
    for (let i = 0; i <= gridCountY; i++) {
      const y = pad.top + (i / gridCountY) * chartH
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(w - pad.right, y)
      ctx.stroke()

      const tempVal = maxTemp - (i / gridCountY) * tempRange
      ctx.fillStyle = '#4de3ff'
      ctx.font = '11px "Noto Sans SC"'
      ctx.textAlign = 'right'
      ctx.fillText(`${tempVal.toFixed(1)}°C`, pad.left - 6, y + 4)
    }

    const gridCountX = 6
    for (let i = 0; i <= gridCountX; i++) {
      const x = pad.left + (i / gridCountX) * chartW
      ctx.beginPath()
      ctx.strokeStyle = '#1a3a5c'
      ctx.moveTo(x, pad.top)
      ctx.lineTo(x, h - pad.bottom)
      ctx.stroke()

      const timeVal = (i / gridCountX) * totalTime
      ctx.fillStyle = '#4de3ff'
      ctx.font = '11px "Noto Sans SC"'
      ctx.textAlign = 'center'
      ctx.fillText(`${Math.floor(timeVal)}s`, x, h - pad.bottom + 16)
    }

    const targetY = toY(targetTemp)
    ctx.beginPath()
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = '#00E676'
    ctx.lineWidth = 1.5
    ctx.moveTo(pad.left, targetY)
    ctx.lineTo(w - pad.right, targetY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#00E676'
    ctx.font = '11px "Noto Sans SC"'
    ctx.textAlign = 'left'
    ctx.fillText(`目标 ${targetTemp}°C`, w - pad.right - 80, targetY - 6)

    if (tempHistory.length > 1) {
      const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom)
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.2)')
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)')

      ctx.beginPath()
      ctx.moveTo(toX(tempHistory[0].time), h - pad.bottom)
      for (const point of tempHistory) {
        ctx.lineTo(toX(point.time), toY(point.temp))
      }
      ctx.lineTo(toX(tempHistory[tempHistory.length - 1].time), h - pad.bottom)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.strokeStyle = '#00D4FF'
      ctx.lineWidth = 2
      ctx.moveTo(toX(tempHistory[0].time), toY(tempHistory[0].temp))
      for (let i = 1; i < tempHistory.length; i++) {
        ctx.lineTo(toX(tempHistory[i].time), toY(tempHistory[i].temp))
      }
      ctx.stroke()

      const last = tempHistory[tempHistory.length - 1]
      const lastX = toX(last.time)
      const lastY = toY(last.temp)
      const pulseSize = 4 + Math.sin(Date.now() / 300) * 2

      ctx.beginPath()
      ctx.arc(lastX, lastY, pulseSize + 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 212, 255, 0.2)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(lastX, lastY, pulseSize, 0, Math.PI * 2)
      ctx.fillStyle = '#00D4FF'
      ctx.fill()
    }

    animRef.current = requestAnimationFrame(draw)
  }, [tempHistory, targetTemp, totalTime, elapsed])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const tempDiff = Math.abs(currentTemp - targetTemp)
  const tempColor =
    tempDiff <= 2 ? '#00E676' : tempDiff <= 5 ? '#FF6B35' : '#FF1744'

  return (
    <div className="panel-base p-3 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-ice-300 font-body flex items-center gap-1">
          🌡️ 温度监控
        </span>
        <span
          className="font-orbitron text-2xl font-bold"
          style={{ color: tempColor }}
        >
          {currentTemp.toFixed(1)}°C
        </span>
      </div>
      <div ref={containerRef} className="w-full" style={{ height: 240 }}>
        <canvas ref={canvasRef} className="w-full h-full rounded" />
      </div>
    </div>
  )
}
