import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { usePlayer } from '../../../stores/player'
import { getCachedLyrics, type LyricLine } from '../../../services/lyrics'
import { cn } from '../../../lib/utils'

export default function AppleLyrics() {
  const { current, currentTime } = usePlayer()
  const [synced, setSynced] = useState<LyricLine[] | null>(null)
  const [plain, setPlain] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [instrumental, setInstrumental] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!current) return
    setLoading(true)
    setSynced(null)
    setPlain(null)
    setInstrumental(false)

    getCachedLyrics(current.title, current.artist, current.durationSec).then(res => {
      setSynced(res.synced)
      setPlain(res.plain)
      setInstrumental(res.instrumental)
      setLoading(false)
    })
  }, [current?.id])

  // Find current lyric index based on time
  const activeIndex = useMemo(() => {
    if (!synced || synced.length === 0) return -1
    // Find last line where time <= currentTime
    for (let i = synced.length - 1; i >= 0; i--) {
      if (synced[i].time <= currentTime) return i
    }
    return 0
  }, [synced, currentTime])

  // Auto-scroll to active line (Apple Music style - center it)
  useEffect(() => {
    if (activeIndex >= 0 && activeRef.current && containerRef.current) {
      const container = containerRef.current
      const activeEl = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const activeRect = activeEl.getBoundingClientRect()
      
      // Calculate scroll to center active line
      const scrollTop = activeEl.offsetTop - container.offsetTop - (containerRect.height / 2) + (activeRect.height / 2)
      
      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      })
    }
  }, [activeIndex])

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 px-6">
        <div className="space-y-6">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-7 bg-white/[0.06] rounded-full animate-pulse" style={{ width: `${60 + Math.random()*35}%` }} />
              <div className="h-4 bg-white/[0.04] rounded-full animate-pulse" style={{ width: `${40 + Math.random()*30}%` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (instrumental) {
    return (
      <div className="w-full max-w-2xl mx-auto py-24 px-6 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#CBA6F7]/10 border border-[#CBA6F7]/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CBA6F7" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
        <p className="font-serif text-2xl text-[#EDEEF7]">Instrumental</p>
        <p className="text-sm text-[#7A7F98] mt-2">This track has no lyrics — just vibes</p>
      </div>
    )
  }

  if (synced && synced.length > 0) {
    return (
      <div ref={containerRef} className="w-full max-w-2xl mx-auto h-[60vh] sm:h-[65vh] overflow-y-auto overscroll-contain scroll-smooth px-6 py-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-8 pb-32">
          {synced.map((line, i) => {
            const isActive = i === activeIndex
            const isPast = i < activeIndex
            const isNext = i === activeIndex + 1
            const distance = Math.abs(i - activeIndex)

            return (
              <motion.div
                key={i}
                ref={isActive ? activeRef : null}
                initial={false}
                animate={{
                  scale: isActive ? 1.08 : 0.96,
                  opacity: isActive ? 1 : isPast ? 0.35 : isNext ? 0.6 : Math.max(0.15, 1 - distance * 0.18),
                  filter: isActive ? 'blur(0px)' : `blur(${Math.min(distance * 0.6, 2)}px)`,
                  y: 0
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8
                }}
                className={cn(
                  'font-serif leading-[1.35] tracking-wide transition-colors duration-300 cursor-pointer select-none touch-manipulation',
                  'text-[22px] sm:text-[28px] md:text-[32px]',
                  isActive ? 'text-white font-bold' : 'text-[#A6ADC8] font-medium hover:text-[#CDD6F4]',
                  isPast && 'hover:text-[#A6ADC8]'
                )}
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  textShadow: isActive ? '0 0 30px rgba(203,166,247,0.4), 0 2px 20px rgba(0,0,0,0.5)' : 'none',
                  transformOrigin: 'left center'
                }}
                onClick={() => {
                  const audio = document.querySelector('audio') as HTMLAudioElement
                  if (audio) audio.currentTime = line.time + 0.1
                }}
              >
                {line.text}
              </motion.div>
            )
          })}
          <div className="h-32" />
        </div>
      </div>
    )
  }

  if (plain) {
    const lines = plain.split('\n').filter(l => l.trim())
    return (
      <div className="w-full max-w-xl mx-auto py-8 px-6">
        <div className="space-y-5">
          {lines.map((line, i) => (
            <p
              key={i}
              className={cn(
                'font-serif leading-[1.6] tracking-wide',
                line.trim() === '' ? 'h-4' : 'text-[18px] sm:text-[20px]',
                'text-[#CDD6F4]/80 hover:text-[#EDEEF7] transition-colors'
              )}
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              {line || '\u00A0'}
            </p>
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-[#7A7F98]/40 mt-12 text-center">Plain lyrics • Auto-scroll unavailable • Tap to seek not supported</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto py-20 px-6 text-center">
      <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A7F98" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      </div>
      <p className="font-serif text-xl text-[#A6ADC8]/70">No lyrics found</p>
      <p className="text-[12px] text-[#7A7F98] mt-2 max-w-sm mx-auto leading-relaxed">
        We searched LRCLIB for "{current?.title}" by {current?.artist.split(',')[0]} but couldn't find synced lyrics. Some tracks just don't have lyrics yet.
      </p>
      <button
        onClick={() => window.open(`https://lrclib.net/search?q=${encodeURIComponent(`${current?.title} ${current?.artist}`)}`, '_blank')}
        className="mt-6 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-[#A6ADC8] hover:text-white hover:bg-white/10 text-[12px] transition-colors"
      >
        Search LRCLIB
      </button>
    </div>
  )
}
