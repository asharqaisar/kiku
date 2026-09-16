import { useEffect, useRef, useState, useCallback } from 'react'
import { seededWave, formatTime } from '../../../lib/utils'

export default function WaveformScrubber({ trackId, progress, buffered = 0, duration = 0, variant = 'mini', onSeek }: { trackId: string | null, progress: number, buffered?: number, duration?: number, variant?: 'mini' | 'full', onSeek: (p: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [wave, setWave] = useState<number[]>([])
  const [dragging, setDragging] = useState(false)
  const [hoverX, setHoverX] = useState(-1)
  const [localProgress, setLocalProgress] = useState(progress)
  const rafRef = useRef<number>(0)

  const bar = 2
  const gap = variant === 'mini' ? 3 : 2
  const height = variant === 'mini' ? 16 : 48

  // Sync prop to local for smooth updates
  useEffect(() => {
    if (!dragging) setLocalProgress(progress)
  }, [progress, dragging])

  // Performance: Listen to high-freq time updates via custom event (60fps) without Zustand re-renders
  useEffect(() => {
    const handler = (e: any) => {
      if (dragging) return
      const { currentTime, duration: dur } = e.detail
      if (dur && trackId) {
        const pct = currentTime / dur
        if (Math.abs(pct - localProgress) > 0.001) {
          setLocalProgress(pct)
        }
      }
    }
    window.addEventListener('kiku:time' as any, handler)
    return () => window.removeEventListener('kiku:time' as any, handler)
  }, [dragging, localProgress, trackId])

  useEffect(() => {
    if (!canvasRef.current || !trackId) return
    const resize = () => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) // Performance: cap DPR at 1.5
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d', { alpha: true })!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.max(16, Math.floor((rect.width + gap) / (bar + gap)))
      setWave(seededWave(trackId, n))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [trackId])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !wave.length) return
    const ctx = canvas.getContext('2d', { alpha: true })!
    const rect = canvas.getBoundingClientRect()
    const w = rect.width, h = rect.height
    ctx.clearRect(0, 0, w, h)
    const px = localProgress * w, bx = buffered * w

    const drawBars = (color: string | CanvasGradient) => {
      ctx.fillStyle = color as string
      const step = w / wave.length
      for (let i = 0; i < wave.length; i++) {
        const bh = Math.max(2, wave[i] * h)
        const x = i * step + (step - bar) / 2
        const y = (h - bh) / 2
        ctx.beginPath()
        // @ts-ignore
        if (ctx.roundRect) ctx.roundRect(x, y, bar, bh, bar / 2)
        else ctx.fillRect(x, y, bar, bh)
        ctx.fill()
      }
    }

    const clipped = (x0: number, x1: number, fn: () => void) => {
      ctx.save()
      ctx.beginPath()
      ctx.rect(x0, 0, x1 - x0, h)
      ctx.clip()
      fn()
      ctx.restore()
    }

    drawBars('rgba(205,214,244,.14)')
    if (bx > px) clipped(px, bx, () => drawBars('rgba(205,214,244,.26)'))
    if (px > 0) {
      const g = ctx.createLinearGradient(0, 0, px, 0)
      g.addColorStop(0, '#B7A3EE')
      g.addColorStop(1, '#E6D8FF')
      clipped(0, px, () => drawBars(g))
    }
    if (hoverX >= 0 && !dragging) {
      ctx.fillStyle = 'rgba(255,255,255,.35)'
      ctx.fillRect(hoverX - 0.5, 0, 1, h)
    }
    if (dragging) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(px - 0.75, 0, 1.5, h)
      ctx.beginPath()
      ctx.arc(px, h / 2, 4, 0, 6.283)
      ctx.fill()
    }
  }, [wave, localProgress, buffered, hoverX, dragging])

  // Performance: RAF for canvas draw
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [draw])

  const pctOf = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  }

  return (
    <div ref={wrapRef} className={`relative w-full cursor-pointer touch-none select-none will-change-transform ${variant === 'mini' ? 'py-1 mb-2' : 'py-2'}`}>
      {dragging && (
        <span className="absolute -top-7 left-0 -translate-x-1/2 font-mono text-[11px] bg-[#CBA6F7] text-[#11111B] px-2 py-1 rounded-md pointer-events-none z-10" style={{ left: `${localProgress * 100}%` }}>
          {formatTime(localProgress * duration)}
        </span>
      )}
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full block will-change-transform"
        onPointerDown={(e) => { setDragging(true); (e.target as HTMLElement).setPointerCapture(e.pointerId); const p = pctOf(e); setLocalProgress(p); onSeek(p); }}
        onPointerMove={(e) => {
          if (dragging) { const p = pctOf(e); setLocalProgress(p); }
          else setHoverX(pctOf(e) * (canvasRef.current?.getBoundingClientRect().width || 0))
        }}
        onPointerUp={(e) => { if (dragging) { onSeek(pctOf(e)); setDragging(false) } }}
        onPointerLeave={() => setHoverX(-1)}
      />
    </div>
  )
}
