import GlassSurface from '../../reactbits/GlassSurface'
import WaveformScrubber from './WaveformScrubber'
import ElasticSlider from '../../reactbits/ElasticSlider'
import { usePlayer } from '../../../stores/player'
import { usePlayerControls } from '../../../hooks/usePlayerControls'
import { useState, useRef } from 'react'
import { motion, PanInfo } from 'motion/react'

export default function MiniPlayer({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement> }) {
  const { current, isPlaying, currentTime, duration, buffered, volume, muted, setVolume, setMuted, setModal, setDrawer, queue, index } = usePlayer()
  const { togglePlay, playNext, playPrev } = usePlayerControls(audioRef)
  const [showVol, setShowVol] = useState(false)
  const touchStartY = useRef<number>(0)

  if (!current) return null

  const progress = duration ? currentTime / duration : 0
  const bufferedProgress = duration ? buffered / duration : 0

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.touches[0].clientY
    if (delta > 50) setModal(true)
  }

  const handlePan = (_: any, info: PanInfo) => {
    if (info.offset.y < -80) setModal(true)
  }

  return (
    <div 
      className="fixed inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-auto sm:w-[680px] max-w-2xl z-40 touch-manipulation" 
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handlePan}
        className="w-full"
      >
        <GlassSurface width="100%" height={84} borderRadius={20} backgroundOpacity={0.92} blur={24} className="!h-auto !py-3 px-4 sm:px-5 border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/25 sm:hidden pointer-events-none" />
          
          <WaveformScrubber trackId={current.id} progress={progress} buffered={bufferedProgress} duration={duration} variant="mini" onSeek={(p) => { if (audioRef.current?.duration) audioRef.current.currentTime = p * audioRef.current.duration }} />
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Song icon - tap for lyrics (new feature) */}
              <button 
                onClick={(e) => { e.stopPropagation(); setModal(true, true) }} 
                className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#313244] border border-white/10 shrink-0 shadow-sm group/icon touch-manipulation"
                aria-label="Show lyrics"
              >
                <img src={current.thumb} srcSet={current.thumbSrcSet} sizes="44px" alt="" className="w-full h-full object-cover group-hover/icon:scale-105 transition-transform" loading="lazy" decoding="async" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
              </button>
              
              <div className="min-w-0 flex-1 cursor-pointer touch-manipulation" onClick={() => setModal(true, false)}>
                <h4 className="font-serif text-[14px] sm:text-[15px] font-semibold text-[#EDEEF7] truncate leading-tight tracking-wide" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  {current.title}
                </h4>
                <p className="font-sans text-[11px] sm:text-[12px] text-[#A6ADC8] truncate mt-0.5">{current.artist}</p>
              </div>
              
              <div className="sm:hidden text-[#CBA6F7]/60 ml-1 cursor-pointer" onClick={() => setModal(true, false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setDrawer(true, 'upnext') }}
                className="relative w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A6ADC8] hover:text-[#CBA6F7] hover:border-[#CBA6F7]/20 transition-colors touch-manipulation mr-0.5"
                aria-label="Queue"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                {queue.length - index - 1 > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#CBA6F7] text-[#11111B] text-[9px] font-bold flex items-center justify-center">
                    {queue.length - index - 1}
                  </span>
                )}
              </button>

              <div className="relative hidden sm:block">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowVol(!showVol) }} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A6ADC8] hover:text-[#CDD6F4] hover:bg-white/10 transition-colors touch-manipulation"
                  aria-label="Volume"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {muted || volume === 0 ? (
                      <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></>
                    ) : volume < 0.5 ? (
                      <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
                    ) : (
                      <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
                    )}
                  </svg>
                </button>
                {showVol && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-3 rounded-2xl bg-[#1E1E2E] border border-white/10 shadow-2xl z-50 backdrop-blur-xl">
                    <ElasticSlider value={muted ? 0 : volume} onChange={(v) => { setVolume(v); setMuted(false); if (audioRef.current) audioRef.current.volume = v; }} />
                  </div>
                )}
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); playPrev() }} 
                className="w-8 h-8 hidden sm:flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A6ADC8] hover:text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
                aria-label="Previous"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/></svg>
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay() }} 
                className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-[#CBA6F7] text-[#11111B] flex items-center justify-center hover:bg-[#d8bbf9] active:scale-95 transition-all shadow-md touch-manipulation"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                )}
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); playNext() }} 
                className="w-8 h-8 hidden sm:flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A6ADC8] hover:text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
                aria-label="Next"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>
              </button>

              {/* Mobile: next button visible */}
              <button 
                onClick={(e) => { e.stopPropagation(); playNext() }} 
                className="w-8 h-8 sm:hidden flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A6ADC8] hover:text-white active:scale-95 transition-all touch-manipulation"
                aria-label="Next"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>
              </button>
            </div>

            <div className="hidden lg:flex font-mono text-[11px] text-[#A6ADC8]/70 gap-1 min-w-[70px] justify-end items-center">
              <span className="text-[#CDD6F4]">{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
              <span className="opacity-40">/</span>
              <span>{current.duration}</span>
            </div>
          </div>
        </GlassSurface>
      </motion.div>
    </div>
  )
}
