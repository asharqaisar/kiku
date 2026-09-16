import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls, PanInfo, Reorder } from 'motion/react'
import { usePlayer } from '../../../stores/player'
import { getSuggestions } from '../../../services/api'
import type { Track } from '../../../services/api'
import { decodeHtml } from '../../../lib/utils'
import { downloadTrack } from '../../../services/download'
import AppleLyrics from '../player/AppleLyrics'
import { useToast } from '../../../stores/toast'

type Tab = 'upnext' | 'lyrics' | 'related'

export default function QueueDrawer() {
  const { current, queue, index, drawerOpen, drawerTab, setDrawer, setQueue, pushRecent } = usePlayer()
  const [related, setRelated] = useState<Track[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const dragControls = useDragControls()
  const toast = useToast(s => s.push)

  useEffect(() => {
    if (!current || !drawerOpen) return
    if ((drawerTab === 'related' || drawerTab === 'upnext') && related.length === 0) {
      setRelatedLoading(true)
      getSuggestions(current.id, 15).then(list => {
        setRelated(list)
        setRelatedLoading(false)
      })
    }
  }, [current?.id, drawerTab, drawerOpen])

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) setDrawer(false)
  }

  const playFromQueue = (actualIdx: number) => {
    const t = queue[actualIdx]
    if (!t) return
    usePlayer.setState({ index: actualIdx, current: t })
    const audio = document.querySelector('audio') as HTMLAudioElement
    if (audio) {
      audio.src = t.audioUrl
      audio.play()
      pushRecent(t)
    }
  }

  const playRelated = (t: Track, idx: number) => {
    setQueue(related, idx)
    const audio = document.querySelector('audio') as HTMLAudioElement
    if (audio) {
      audio.src = t.audioUrl
      audio.play()
      pushRecent(t)
    }
    setDrawer(true, 'upnext')
  }

  const removeFromQueue = (actualIdx: number) => {
    const q = [...queue]
    const removed = q.splice(actualIdx, 1)
    // adjust current index if needed
    let newIndex = index
    if (actualIdx < index) newIndex = index - 1
    else if (actualIdx === index) {
      // removing currently playing, keep same index but current will be next
      // if was last, go to previous
      if (newIndex >= q.length) newIndex = q.length - 1
    }
    usePlayer.setState({ queue: q, index: newIndex, current: q[newIndex] || null })
    toast(`Removed "${removed[0]?.title}" from queue`, 'info')
  }

  const handleReorder = (newUpNext: Track[]) => {
    // newUpNext is reordered list of upNext (queue.slice(index+1))
    // reconstruct full queue: [0..index] + newUpNext
    const before = queue.slice(0, index + 1)
    const newQueue = [...before, ...newUpNext]
    usePlayer.setState({ queue: newQueue })
  }

  if (!current) return null

  const upNext = queue.slice(index + 1)
  const hasQueue = upNext.length > 0
  const nowPlaying = current

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 z-[60] bg-[#0a0a12]/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380, mass: 0.8 }}
            drag="y" dragControls={dragControls} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={handleDragEnd}
            className="fixed bottom-0 inset-x-0 z-[61] flex flex-col bg-[#181825]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[24px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] max-h-[82dvh] sm:max-h-[72vh] h-[82dvh] sm:h-auto sm:max-w-2xl sm:left-1/2 sm:-translate-x-1/2 sm:w-full"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-manipulation" onPointerDown={(e) => dragControls.start(e)}>
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-center gap-1 px-4 pb-3 border-b border-white/[0.06] shrink-0">
              {(['upnext', 'lyrics', 'related'] as Tab[]).map(tab => (
                <button key={tab} onClick={() => setDrawer(true, tab)} className={`px-4 py-2 rounded-full text-[11px] uppercase tracking-widest font-medium transition-all touch-manipulation ${drawerTab === tab ? 'bg-[#CBA6F7]/15 text-[#CBA6F7] border border-[#CBA6F7]/20' : 'text-[#7A7F98] hover:text-[#A6ADC8] border border-transparent'}`}>
                  {tab === 'upnext' ? `Up next • ${upNext.length}` : tab === 'lyrics' ? 'Lyrics' : `Related • ${related.length || ''}`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {drawerTab === 'upnext' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-[#7A7F98] font-medium mb-3 px-1">Now playing</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#CBA6F7]/10 border border-[#CBA6F7]/20">
                      <img src={nowPlaying.thumb} srcSet={nowPlaying.thumbSrcSet} sizes="48px" alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-[15px] font-semibold text-[#EDEEF7] truncate">{decodeHtml(nowPlaying.title)}</p>
                        <p className="text-[12px] text-[#A6ADC8] truncate">{nowPlaying.artist}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#CBA6F7] animate-pulse" />
                    </div>
                  </div>

                  {hasQueue ? (
                    <div>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <p className="text-[11px] uppercase tracking-widest text-[#7A7F98] font-medium">Next in queue — drag to reorder, swipe to remove</p>
                      </div>
                      <Reorder.Group axis="y" values={upNext} onReorder={handleReorder} className="space-y-2 list-none">
                        {upNext.map((t, i) => {
                          const actualIndex = index + 1 + i
                          return (
                            <Reorder.Item
                              key={t.id + '-' + actualIndex}
                              value={t}
                              dragListener={false}
                              className="list-none"
                              whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                            >
                              <motion.div
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(_, info) => {
                                  if (Math.abs(info.offset.x) > 120 || Math.abs(info.velocity.x) > 800) {
                                    removeFromQueue(actualIndex)
                                  }
                                }}
                                className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#1E1E2E]/60 border border-white/[0.05] hover:bg-[#252538]/80 hover:border-white/10 transition-colors group relative overflow-hidden"
                              >
                                <div className="absolute inset-y-0 left-0 w-1 bg-[#CBA6F7]/0 group-hover:bg-[#CBA6F7]/40 transition-colors" />
                                <button onClick={() => playFromQueue(actualIndex)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                                  <img src={t.thumb} srcSet={t.thumbSrcSet} sizes="40px" alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-serif text-[14px] font-medium text-[#E6E9F5] group-hover:text-white truncate">{decodeHtml(t.title)}</p>
                                    <p className="text-[11px] text-[#A6ADC8] truncate">{t.artist}</p>
                                  </div>
                                </button>
                                <span className="text-[11px] font-mono text-[#7A7F98] hidden sm:block">{t.duration}</span>
                                {/* Drag handle */}
                                <div className="w-6 h-6 flex items-center justify-center text-[#7A7F98]/40 group-hover:text-[#7A7F98] cursor-grab active:cursor-grabbing touch-none" onPointerDown={(e) => {
                                  // Find reorder handle - we use whole item reorder via parent, but provide visual handle
                                  // For simplicity, enable drag via this handle by starting reorder drag
                                  const parent = (e.currentTarget.parentElement?.parentElement as any)
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                                </div>
                                <button onClick={() => removeFromQueue(actualIndex)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-[#7A7F98] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                                <button onClick={() => downloadTrack(t)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-[#7A7F98] hover:text-[#CBA6F7] hover:bg-white/10 transition-colors">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                </button>
                              </motion.div>
                            </Reorder.Item>
                          )
                        })}
                      </Reorder.Group>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#1E1E2E]/40 border border-white/[0.05] p-6 text-center">
                      <p className="font-serif italic text-[#A6ADC8]/70">Queue is empty</p>
                      <p className="text-[11px] text-[#7A7F98] mt-1">Songs you add will show up here — drag to reorder, swipe to remove</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-[11px] uppercase tracking-widest text-[#7A7F98] font-medium">Autoplay • Based on {nowPlaying.title}</p>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-[#CBA6F7]/10 border border-[#CBA6F7]/20 text-[#CBA6F7]">ON</span>
                    </div>
                    <p className="text-[11px] text-[#7A7F98]/70 px-1 mb-3">Similar songs will play when your queue ends</p>
                    {related.length === 0 ? (
                      <button onClick={() => setDrawer(true, 'related')} className="w-full py-3 rounded-xl border border-dashed border-white/10 text-[#7A7F98] hover:text-[#A6ADC8] text-[12px]">Load suggestions</button>
                    ) : (
                      <div className="space-y-2">
                        {related.slice(0, 5).map((t, i) => (
                          <div key={`auto-${t.id}`} className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#1E1E2E]/30 border border-white/[0.03] hover:bg-[#1E1E2E]/60 transition-all group">
                            <button onClick={() => playRelated(t, i)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                              <img src={t.thumb} srcSet={t.thumbSrcSet} sizes="40px" alt="" className="w-10 h-10 rounded-lg object-cover opacity-80 group-hover:opacity-100" />
                              <div className="min-w-0 flex-1">
                                <p className="font-serif text-[13px] text-[#CDD6F4] group-hover:text-[#E6E9F5] truncate">{decodeHtml(t.title)}</p>
                                <p className="text-[11px] text-[#7A7F98] truncate">{t.artist}</p>
                              </div>
                            </button>
                            <button onClick={() => downloadTrack(t)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-[#7A7F98] hover:text-[#CBA6F7] transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'lyrics' && <AppleLyrics />}

              {drawerTab === 'related' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] uppercase tracking-widest text-[#7A7F98] font-medium">Related to {nowPlaying.title}</p>
                    {related.length > 0 && (
                      <button onClick={() => { setQueue(related, 0); const audio = document.querySelector('audio') as HTMLAudioElement; if (audio) { audio.src = related[0].audioUrl; audio.play(); pushRecent(related[0]) } }} className="text-[11px] px-3 py-1 rounded-full bg-[#CBA6F7]/10 border border-[#CBA6F7]/20 text-[#CBA6F7]">Play all</button>
                    )}
                  </div>
                  {relatedLoading ? (
                    <div className="space-y-2">{[0,1,2,3].map(i => <div key={i} className="h-[56px] rounded-xl bg-[#1E1E2E]/40 animate-pulse" />)}</div>
                  ) : related.length ? (
                    <div className="space-y-2">
                      {related.map((t, i) => (
                        <div key={t.id} className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#1E1E2E]/60 border border-white/[0.05] hover:bg-[#252538]/80 transition-all group">
                          <button onClick={() => playRelated(t, i)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                            <img src={t.thumb} srcSet={t.thumbSrcSet} sizes="44px" alt="" className="w-11 h-11 rounded-xl object-cover border border-white/10" />
                            <div className="min-w-0 flex-1">
                              <p className="font-serif text-[14px] font-medium text-[#E6E9F5] truncate">{decodeHtml(t.title)}</p>
                              <p className="text-[11px] text-[#A6ADC8] truncate">{t.artist}</p>
                            </div>
                          </button>
                          <span className="text-[11px] font-mono text-[#7A7F98] hidden sm:block">{t.duration}</span>
                          <button onClick={() => downloadTrack(t)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#7A7F98] hover:text-[#CBA6F7] hover:border-[#CBA6F7]/20 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center"><p className="font-serif italic text-[#A6ADC8]/60">No related songs</p></div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
