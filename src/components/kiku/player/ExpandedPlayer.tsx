import TiltedCard from '../../reactbits/TiltedCard'
import WaveformScrubber from './WaveformScrubber'
import AppleLyrics from './AppleLyrics'
import { usePlayer } from '../../../stores/player'
import { usePlayerControls } from '../../../hooks/usePlayerControls'
import { motion, AnimatePresence, useDragControls } from 'motion/react'
import { useRef, useState, useEffect } from 'react'
import { downloadTrack } from '../../../services/download'

export default function ExpandedPlayer({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement> }) {
  const { current, isPlaying, currentTime, duration, buffered, isModalOpen, setModal, toggleLike, isLiked, setDrawer, showLyricsInExpanded } = usePlayer()
  const { togglePlay, playNext, playPrev } = usePlayerControls(audioRef)
  const [dragY, setDragY] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false) // local toggle
  const dragControls = useDragControls()
  const cardRef = useRef<HTMLDivElement>(null)

  // Sync with store: when mini player song icon pressed, open directly to lyrics
  useEffect(() => {
    if (isModalOpen) {
      setShowLyrics(showLyricsInExpanded)
    } else {
      setShowLyrics(false)
    }
  }, [isModalOpen, showLyricsInExpanded])

  if (!current) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setModal(false)
  }

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      setModal(false)
    }
    setDragY(0)
  }

  // When modal opens, reset lyrics view
  const handleOpenLyrics = () => {
    setShowLyrics(true)
    // Also open drawer to lyrics as fallback, but we show inline Apple style
    // setDrawer(true, 'lyrics')
  }

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 bg-[#0a0a12]/80 backdrop-blur-2xl touch-manipulation"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none blur-[60px] scale-110 opacity-20">
              <img src={current.cover} srcSet={current.coverSrcSet} sizes="100vw" alt="" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDrag={(_, info) => setDragY(info.offset.y)}
            onDragEnd={handleDragEnd}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[51] flex items-end sm:items-center justify-center p-0 sm:p-6 touch-manipulation"
            style={{ y: dragY }}
          >
            <motion.div
              ref={cardRef}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.05 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-lg sm:max-h-[92vh] sm:rounded-[24px] rounded-t-[24px] sm:rounded-b-[24px] bg-[#1E1E2E]/90 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[92vh] h-[92dvh] sm:h-auto"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div 
                className="flex justify-center pt-3 pb-2 sm:hidden cursor-grab active:cursor-grabbing touch-manipulation"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1.5 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between px-6 py-3 sm:py-4 shrink-0">
                <button 
                  onClick={() => setModal(false)} 
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A6ADC8] hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div className="flex flex-col items-center">
                  <span className="logo text-[15px] text-[#CBA6F7] leading-none">kiku.</span>
                  <h3 className="font-sans text-[11px] uppercase tracking-widest text-[#A6ADC8]/70 mt-0.5">
                    {showLyrics ? 'Lyrics' : 'Now playing'}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={async () => { if (downloading) return; await downloadTrack(current, setDownloading) }}
                    className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors touch-manipulation mr-1 ${downloading ? 'bg-[#CBA6F7]/15 border-[#CBA6F7]/30 text-[#CBA6F7]' : 'bg-white/5 border-white/10 text-[#A6ADC8] hover:text-white hover:bg-white/10'}`}
                    aria-label="Download"
                  >
                    {downloading ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    )}
                  </button>
                  <button 
                    onClick={() => setDrawer(true, 'upnext')} 
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A6ADC8] hover:text-white hover:bg-white/10 transition-colors touch-manipulation mr-1"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                  </button>
                  <button 
                    onClick={() => toggleLike(current)} 
                    className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${isLiked(current.id) ? 'bg-[#CBA6F7]/15 border-[#CBA6F7]/30 text-[#CBA6F7]' : 'bg-white/5 border-white/10 text-[#A6ADC8] hover:text-white'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked(current.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
                <AnimatePresence mode="wait">
                  {showLyrics ? (
                    <motion.div
                      key="lyrics"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="flex-1 flex flex-col"
                    >
                      {/* Lyrics header with cover thumb */}
                      <div className="px-6 sm:px-8 py-3 flex items-center gap-3 border-b border-white/[0.06] shrink-0">
                        <button onClick={() => setShowLyrics(false)} className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 relative group">
                          <img src={current.thumb} srcSet={current.thumbSrcSet} sizes="48px" alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                          </div>
                        </button>
                        <div className="min-w-0">
                          <p className="font-serif text-[14px] font-semibold text-[#EDEEF7] truncate">{current.title}</p>
                          <p className="text-[11px] text-[#A6ADC8] truncate">{current.artist}</p>
                        </div>
                        <button onClick={() => setShowLyrics(false)} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#A6ADC8] hover:text-white">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                      
                      {/* Apple Music style lyrics */}
                      <div className="flex-1">
                        <AppleLyrics />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cover"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="flex-1 flex flex-col px-6 sm:px-8 pb-6"
                    >
                      <div className="flex flex-col items-center py-2 sm:py-4">
                        {/* Tap cover -> lyrics - core feature */}
                        <button 
                          onClick={() => setShowLyrics(true)}
                          className="w-[68vw] max-w-[280px] sm:w-72 sm:h-72 aspect-square shrink-0 relative group touch-manipulation"
                          aria-label="Show lyrics"
                        >
                          <TiltedCard imageSrc={current.cover} srcSet={current.coverSrcSet} sizes="(max-width: 640px) 68vw, 288px" alt={current.title} containerHeight="100%" />
                        </button>
                        
                        <div className="w-full text-center mt-6 px-2">
                          <h2 className="font-serif text-[22px] sm:text-[28px] font-semibold text-[#EDEEF7] leading-tight tracking-wide line-clamp-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {current.title}
                          </h2>
                          <p className="font-sans text-[13px] text-[#A6ADC8] mt-2 line-clamp-1">{current.artist}</p>
                          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                            {current.tags.map(t => (
                              <span key={t} className="inline-flex text-[10px] leading-none tracking-wide px-2.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#A6ADC8] lowercase">
                                {t}
                              </span>
                            ))}
                          </div>

                        </div>
                      </div>

                      <div className="w-full mt-auto pt-6 space-y-5">
                        <div>
                          <WaveformScrubber 
                            trackId={current.id} 
                            progress={duration ? currentTime / duration : 0} 
                            buffered={duration ? buffered / duration : 0} 
                            duration={duration} 
                            variant="full" 
                            onSeek={(p) => { if (audioRef.current) audioRef.current.currentTime = p * audioRef.current.duration }} 
                          />
                          <div className="flex justify-between text-[11px] font-mono text-[#A6ADC8]/70 mt-2 px-1">
                            <span className="text-[#CDD6F4]">{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                            <span>{current.duration}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 sm:gap-6">
                          <button onClick={playPrev} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-[#CDD6F4] hover:bg-white/10 active:scale-95 transition-all touch-manipulation">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/></svg>
                          </button>
                          <button onClick={togglePlay} className="w-[64px] h-[64px] sm:w-16 sm:h-16 rounded-full bg-[#CBA6F7] hover:bg-[#d8bbf9] text-[#11111B] flex items-center justify-center shadow-[0_8px_24px_rgba(203,166,247,0.3)] active:scale-95 transition-all">
                            {isPlaying ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>}
                          </button>
                          <button onClick={playNext} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-[#CDD6F4] hover:bg-white/10 active:scale-95 transition-all">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setShowLyrics(true)} className="px-4 py-2 rounded-full bg-[#CBA6F7]/10 border border-[#CBA6F7]/20 text-[#CBA6F7] hover:bg-[#CBA6F7]/15 text-[11px] uppercase tracking-widest font-medium flex items-center gap-1.5 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                            Lyrics
                          </button>
                          <span className="text-[11px] text-[#A6ADC8]/30">•</span>
                          <span className="text-[11px] text-[#A6ADC8]/50 font-sans">{current.quality || '320kbps'}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
