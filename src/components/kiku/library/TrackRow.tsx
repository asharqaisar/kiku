import { memo, useState } from 'react'
import SpotlightCard from '../../reactbits/SpotlightCard'
import { usePlayer } from '../../../stores/player'
import type { Track } from '../../../services/api'
import { cn, decodeHtml } from '../../../lib/utils'
import { downloadTrack } from '../../../services/download'

type Props = {
  track: Track
  index: number
  active?: boolean
  playing?: boolean
  onPlay: (i: number) => void
}

function TrackRow({ track, index, active, playing, onPlay }: Props) {
  const toggleLike = usePlayer(s => s.toggleLike)
  const isLiked = usePlayer(s => s.isLiked(track.id))
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (downloading) return
    await downloadTrack(track, setDownloading)
  }

  return (
    <SpotlightCard 
      className={cn(
        'group cursor-pointer p-0 border-0 transition-all duration-300 will-change-transform',
        active && 'ring-1 ring-[#CBA6F7]/40 !border-[#CBA6F7]/30 bg-[#CBA6F7]/[0.08]'
      )} 
      spotlightColor="rgba(203,166,247,0.15)"
    >
      <div onClick={() => onPlay(index)} className={cn('flex items-center justify-between gap-4 px-4 py-3.5 rounded-2xl', active && 'bg-[rgba(203,166,247,0.10)]')}>
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#313244] border border-white/10 shrink-0 shadow-sm">
            <img 
              src={track.thumb}
              srcSet={track.thumbSrcSet}
              sizes="(max-width: 640px) 48px, 48px"
              alt="" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform" 
              loading="lazy" 
              decoding="async"
              fetchPriority={index < 4 ? "high" : "low" as any}
            />
            {active && playing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBA6F7] animate-ping" />
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 
              className={cn(
                'font-serif text-[16px] leading-[1.2] tracking-wide truncate pr-2 transition-colors',
                active ? 'text-[#CBA6F7] font-semibold' : 'text-[#EDEEF7] group-hover:text-white font-medium'
              )}
              style={{ 
                color: active ? '#CBA6F7' : '#E6E9F5',
                textShadow: active ? '0 0 12px rgba(203,166,247,0.3)' : 'none',
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                contain: 'layout'
              }}
            >
              {decodeHtml(track.title)}
            </h3>
            
            <div className="flex items-center gap-2 mt-1 min-w-0">
              <span className="font-sans text-[12px] text-[#A6ADC8] truncate max-w-[180px] sm:max-w-[260px]">{track.artist}</span>
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {track.tags.slice(0, 2).map(t => (
                  <span key={t} className="inline-flex text-[10px] leading-none tracking-wide px-1.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.08] text-[#A6ADC8]/80 lowercase whitespace-nowrap">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-2">
          <span className="font-mono text-[11px] text-[#A6ADC8]/80 group-hover:text-[#A6ADC8] transition-colors mr-1 hidden sm:block">{track.duration}</span>
          <span className="font-mono text-[11px] text-[#A6ADC8]/80 sm:hidden">{track.duration}</span>
          
          <button 
            onClick={(e) => { e.stopPropagation(); toggleLike(track); }} 
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 touch-manipulation',
              isLiked 
                ? 'text-[#CBA6F7] bg-[#CBA6F7]/10 opacity-100' 
                : 'text-[#A6ADC8]/60 hover:text-[#CBA6F7] hover:bg-white/5 opacity-60 sm:opacity-0 group-hover:opacity-100'
            )}
            aria-label="Like"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </button>

          <button 
            onClick={handleDownload}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 touch-manipulation',
              'text-[#A6ADC8]/60 hover:text-[#CBA6F7] hover:bg-white/5',
              'opacity-60 sm:opacity-0 group-hover:opacity-100',
              downloading && '!opacity-100 !text-[#CBA6F7]'
            )}
            aria-label="Download"
            title="Download"
          >
            {downloading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            )}
          </button>
        </div>
      </div>
    </SpotlightCard>
  )
}

export default memo(TrackRow, (prev, next) => {
  return prev.track.id === next.track.id && prev.active === next.active && prev.playing === next.playing && prev.index === next.index
})
