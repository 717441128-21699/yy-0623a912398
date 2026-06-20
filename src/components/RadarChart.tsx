import { GameScore } from '@/types'
import { useRef, useEffect, useState } from 'react'

interface Props {
  score: GameScore
}

const labels = ['响应速度', '温度恢复', '资源利用', '沟通完整度']

export default function RadarChart({ score }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animProgress, setAnimProgress] = useState(0)

  const values = [
    score.responseSpeed,
    score.temperatureRecovery,
    score.resourceWaste,
    score.communicationCompleteness,
  ]

  useEffect(() => {
    let frame = 0
    const totalFrames = 45
    const animate = () => {
      frame++
      const progress = frame / totalFrames
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimProgress(eased)
      if (frame < totalFrames) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 600
    canvas.height = 600
    ctx.scale(2, 2)

    const cx = 150
    const cy = 150
    const maxR = 110
    const angleStep = (2 * Math.PI) / 4
    const startAngle = -Math.PI / 2

    ctx.clearRect(0, 0, 300, 300)

    for (let level = 1; level <= 3; level++) {
      const r = maxR * (level / 3)
      ctx.beginPath()
      for (let i = 0; i <= 4; i++) {
        const angle = startAngle + i * angleStep
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = '#1a3a5c'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    for (let i = 0; i < 4; i++) {
      const angle = startAngle + i * angleStep
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle))
      ctx.strokeStyle = '#1a3a5c'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    ctx.beginPath()
    for (let i = 0; i < 4; i++) {
      const angle = startAngle + i * angleStep
      const r = maxR * (values[i] / 100) * animProgress
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(0, 212, 255, 0.2)'
    ctx.fill()
    ctx.strokeStyle = '#00D4FF'
    ctx.lineWidth = 2
    ctx.stroke()

    for (let i = 0; i < 4; i++) {
      const angle = startAngle + i * angleStep
      const r = maxR * (values[i] / 100) * animProgress
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fillStyle = '#00D4FF'
      ctx.fill()
    }

    for (let i = 0; i < 4; i++) {
      const angle = startAngle + i * angleStep
      const labelR = maxR + 22
      const lx = cx + labelR * Math.cos(angle)
      const ly = cy + labelR * Math.sin(angle)

      ctx.font = '11px "Noto Sans SC", sans-serif'
      ctx.fillStyle = '#80ebff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(labels[i], lx, ly)

      const valR = maxR + 36
      const vx = cx + valR * Math.cos(angle)
      const vy = cy + valR * Math.sin(angle)
      ctx.font = '10px Orbitron, monospace'
      ctx.fillStyle = '#00D4FF'
      ctx.fillText(Math.round(values[i] * animProgress).toString(), vx, vy)
    }
  }, [animProgress, values])

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: 300, height: 300 }}
        className="max-w-full"
      />
    </div>
  )
}
