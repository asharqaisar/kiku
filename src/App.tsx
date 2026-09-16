import { useEffect, useRef, useState, lazy, Suspense, useCallback, useMemo } from 'react'
import './index.css'
import GlassSurface from './components/reactbits/GlassSurface'
import TrackRow from './components/kiku/library/TrackRow'
import MiniPlayer from './components/kiku/player/MiniPlayer'
import SEO from './components/SEO'
import Toaster from './components/kiku/ui/Toaster'
import { usePlayer } from './stores/player'
import { searchSongs, getSuggestions, getSongById } from './services/api'
import { Analytics } from '@vercel/analytics/react'

// Performance: Lazy load heavy components
const Aurora = lazy(() => import('./components/reactbits/Aurora'))
const BlurText = lazy(() => import('./components/reactbits/BlurText'))
const AnimatedContent = lazy(() => import('./components/reactbits/AnimatedContent'))
const ExpandedPlayer = lazy(() => import('./components/kiku/player/ExpandedPlayer'))
const QueueDrawer = lazy(() => import('./components/kiku/drawer/QueueDrawer'))
const About = lazy(() => import('./components/kiku/pages/About'))

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [showAurora, setShowAurora] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const {
    current, queue, index, isPlaying, recent, liked, tracks, view, homeTab,
    setTracks, setView, setHomeTab, setQueue, setPlaying, setTime, pushRecent, setDrawer
  } = usePlayer()

  const abortRef = useRef<AbortController | null>(null)

  const lastTimeUpdate = useRef(0)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const { volume, muted } = usePlayer.getState()
    audio.volume = muted ? 0 : volume
    
    const onTime = () => {
      const now = performance.now()
      if (now - lastTimeUpdate.current < 200) return
      lastTimeUpdate.current = now
      setTime(audio.currentTime, audio.duration || 0, audio.buffered.length ? audio.buffered.end(audio.buffered.length - 1) : 0)
    }
    
    const onTimeHighFreq = () => {
      const event = new CustomEvent('kiku:time', { detail: { currentTime: audio.currentTime, duration: audio.duration } })
      window.dispatchEvent(event)
    }

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = async () => {
      let next = index + 1
      if (next >= queue.length) {
        const more = current ? await getSuggestions(current.id) : []
        if (more.length) usePlayer.setState({ queue: [...queue, ...more] })
        else return
      }
      const q = usePlayer.getState().queue
      const t = q[next]
      if (t) {
        usePlayer.setState({ index: next, current: t })
        audio.src = t.audioUrl
        audio.play()
        pushRecent(t)
      }
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('timeupdate', onTimeHighFreq)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('progress', onTime)
    
    if ('mediaSession' in navigator && current) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        artwork: [{ src: current.cover, sizes: '500x500', type: 'image/jpeg' }]
      })
    }
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('timeupdate', onTimeHighFreq)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('progress', onTime)
    }
  }, [queue, index, current])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = document.activeElement?.tagName === 'INPUT'
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); (document.getElementById('search') as HTMLInputElement)?.focus(); return }
      if (typing) return
      if (e.code === 'Space') { e.preventDefault(); usePlayer.getState().current && audioRef.current?.paused ? audioRef.current.play() : audioRef.current?.pause() }
      if (e.key === '/') { e.preventDefault(); (document.getElementById('search') as HTMLInputElement)?.focus() }
      if (e.key.toLowerCase() === 'q' && usePlayer.getState().current) {
        e.preventDefault()
        const { drawerOpen, setDrawer } = usePlayer.getState()
        setDrawer(!drawerOpen, 'upnext')
      }
      if (e.key === 'Escape') {
        const { isModalOpen, drawerOpen, setModal, setDrawer, view, setView } = usePlayer.getState()
        if (drawerOpen) setDrawer(false)
        else if (isModalOpen) setModal(false)
        else if (view === 'about') setView('home')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const trackId = params.get('track')
    const viewParam = params.get('view')
    if (viewParam === 'about') setView('about')
    if (trackId) {
      getSongById(trackId).then(t => {
        if (t && audioRef.current) {
          setQueue([t], 0)
          audioRef.current.src = t.audioUrl
          pushRecent(t)
        }
      })
    }
  }, [])

  useEffect(() => {
    const checkTouch = () => {
      const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
      setIsTouch(touch)
      if (touch) document.documentElement.classList.add('touch')
    }
    checkTouch()
    
    const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 1000))
    idle(() => {
      const isLowEnd = (() => {
        try {
          const n = navigator as any
          return (n.deviceMemory && n.deviceMemory <= 4) || (n.hardwareConcurrency && n.hardwareConcurrency <= 4) || n.connection?.saveData
        } catch { return false }
      })()
      if (!isLowEnd && !matchMedia('(pointer: coarse)').matches) setShowAurora(true)
    })

    try {
      const n = navigator as any
      const lite = (n.deviceMemory && n.deviceMemory <= 4) || (n.hardwareConcurrency && n.hardwareConcurrency <= 4) || n.connection?.saveData || matchMedia('(prefers-reduced-motion: reduce)').matches
      if (lite) {
        document.documentElement.classList.add('lite')
        usePlayer.setState({ lite: true })
      }
    } catch {}
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setView('home'); setTracks([]); setLoading(false); return }
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    try {
      const res = await searchSongs(q, abortRef.current.signal)
      setTracks(res)
      setView('search')
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error(e)
    } finally { setLoading(false) }
  }, [setTracks, setView])

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => doSearch(q), 300)
  }, [doSearch])

  const displayTracks = useMemo(() => 
    view === 'home' ? (homeTab === 'liked' ? liked : recent) : tracks,
    [view, homeTab, liked, recent, tracks]
  )

  const playIndex = useCallback((i: number) => {
    const list = displayTracks
    setQueue(list, i)
    const t = list[i]
    if (audioRef.current) {
      audioRef.current.src = t.audioUrl
      audioRef.current.play().catch(console.warn)
      pushRecent(t)
    }
  }, [displayTracks, setQueue, pushRecent])

  return (
    <>
      <SEO />
      <div className="relative min-h-[100dvh] bg-[#0E0E15] text-[#E6E9F5] selection:bg-[#CBA6F7]/30 overflow-x-hidden touch-manipulation">
      <div id="aurora" className="fixed inset-0 pointer-events-none z-0">
        {showAurora && !isTouch && (
          <Suspense fallback={null}>
            <Aurora colorStops={['#CBA6F7', '#7c3aed', '#1a1033']} amplitude={0.9} blend={0.4} speed={0.4} />
          </Suspense>
        )}
        <div className="absolute inset-0 bg-[#0E0E15]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-10%,rgba(203,166,247,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_100%_0%,rgba(59,130,246,0.08),transparent_60%)]" />
      </div>

      <audio ref={audioRef} preload="metadata" playsInline />

      <div className="relative z-10 flex flex-col min-h-[100dvh] px-4 sm:px-6 pt-[max(2.5rem,env(safe-area-inset-top))] sm:pt-14 pb-[calc(6rem+env(safe-area-inset-bottom))] max-w-3xl mx-auto w-full">
        <header className="w-full flex flex-col items-center mb-6 sm:mb-8 text-center overflow-visible shrink-0">
          <h1 className="logo text-[42px] sm:text-5xl md:text-6xl tracking-tight text-[#EDEEF7] flex items-baseline gap-0.5 overflow-visible py-2 leading-none">
            <Suspense fallback={<span className="text-[#EDEEF7]">kiku</span>}>
              <BlurText text="kiku" delay={0.06} className="text-[#EDEEF7] overflow-visible" />
            </Suspense>
            <span className="text-[#CBA6F7] font-serif italic font-semibold">.</span>
          </h1>
          <p className="font-sans text-[11px] sm:text-xs tracking-[0.15em] uppercase text-[#7A7F98] font-medium mt-1">made for late-night listening</p>
        </header>

        <section className="w-full mb-6 sm:mb-8 shrink-0">
          <GlassSurface borderRadius={9999} backgroundOpacity={0.06} blur={16} className="!h-auto p-0 border-white/[0.06] hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7F98" strokeWidth="2" className="shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>
              <input
                id="search"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="What do you want to hear?"
                className="w-full bg-transparent outline-none text-[#EDEEF7] placeholder:text-[#7A7F98]/70 text-[15px] font-normal"
                autoComplete="off"
                inputMode="search"
              />
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-sans font-medium text-[#7A7F98] bg-white/[0.04] border border-white/[0.06] shrink-0">⌘K</span>
            </div>
          </GlassSurface>
        </section>

        <section className="w-full flex-1 flex flex-col min-h-0">
          {view === 'about' ? (
            <Suspense fallback={<div className="h-64 rounded-2xl bg-[#1E1E2E]/20 animate-pulse" />}>
              <About />
            </Suspense>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 mb-3 sm:mb-4 shrink-0">
                <span className="font-serif italic text-[12px] sm:text-[13px] text-[#A6ADC8] tracking-wide truncate pr-2">
                  {view === 'home' ? (homeTab === 'liked' ? 'Liked songs' : 'Recently played') : `Results for "${query}"`}
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {view === 'home' && (
                    <>
                      <button onClick={() => setHomeTab('recent')} className={`text-[10px] sm:text-[11px] uppercase tracking-widest px-2.5 sm:px-3 py-1 rounded-full border transition-all touch-manipulation ${homeTab === 'recent' ? 'text-[#CBA6F7] bg-[#CBA6F7]/10 border-[#CBA6F7]/20' : 'text-[#7A7F98] border-white/[0.06] hover:text-[#A6ADC8] hover:border-white/10'}`}>Recent</button>
                      <button onClick={() => setHomeTab('liked')} className={`text-[10px] sm:text-[11px] uppercase tracking-widest px-2.5 sm:px-3 py-1 rounded-full border transition-all touch-manipulation ${homeTab === 'liked' ? 'text-[#CBA6F7] bg-[#CBA6F7]/10 border-[#CBA6F7]/20' : 'text-[#7A7F98] border-white/[0.06] hover:text-[#A6ADC8] hover:border-white/10'}`}>Liked {liked.length ? `· ${liked.length}` : ''}</button>
                    </>
                  )}
                  {current && (
                    <button onClick={() => setDrawer(true, 'upnext')} className="text-[10px] sm:text-[11px] uppercase tracking-widest px-2.5 sm:px-3 py-1 rounded-full border border-white/[0.06] text-[#7A7F98] hover:text-[#CBA6F7] hover:border-[#CBA6F7]/20 hover:bg-[#CBA6F7]/5 transition-all touch-manipulation flex items-center gap-1">
                      Queue
                    </button>
                  )}
                  <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-widest text-[#7A7F98]/70 ml-1">{displayTracks.length} {displayTracks.length === 1 ? 'song' : 'songs'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:gap-3 w-full flex-1">
                {loading ? (
                  <div className="space-y-2.5 sm:space-y-3">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="h-[64px] sm:h-[72px] rounded-2xl bg-[#1E1E2E]/40 border border-white/[0.04] animate-pulse" style={{ animationDelay: `${i*0.05}s` }} />
                    ))}
                  </div>
                ) : displayTracks.map((track, i) => (
                  <Suspense key={`${track.id}-${i}`} fallback={<div className="h-[64px] rounded-2xl bg-[#1E1E2E]/20" />}>
                    <AnimatedContent delay={Math.min(i, 10) * 0.03}>
                      <TrackRow track={track} index={i} active={current?.id === track.id} playing={current?.id === track.id && isPlaying} onPlay={playIndex} />
                    </AnimatedContent>
                  </Suspense>
                ))}
                {!loading && displayTracks.length === 0 && (
                  <div className="rounded-2xl bg-[#1E1E2E]/30 border border-white/[0.05] backdrop-blur-xl py-12 sm:py-14 px-6 text-center">
                    <p className="font-serif italic text-[16px] sm:text-lg text-[#A6ADC8]/70">{view === 'search' ? `Couldn't find anything for "${query}"` : 'Nothing here yet.'}</p>
                    <p className="font-sans text-[12px] sm:text-xs text-[#7A7F98]/70 mt-2 max-w-sm mx-auto leading-relaxed">{view === 'search' ? 'Try a different spelling, or another song.' : 'Type a song, artist or album above to get started.'}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <footer className="w-full mt-10 sm:mt-12 mb-2 text-[10px] sm:text-[11px] text-center text-[#7A7F98]/40 font-sans select-none shrink-0 space-y-2">
          <p>Made with ❤️ by Ashar</p>
          <div className="flex items-center justify-center gap-3 text-[10px]">
            <button onClick={() => setView('home')} className="hover:text-[#A6ADC8] transition-colors underline-offset-2 hover:underline cursor-pointer">Home</button>
            <span className="opacity-30">•</span>
            <button onClick={() => setView('about')} className="hover:text-[#CBA6F7] transition-colors underline-offset-2 hover:underline cursor-pointer">About kiku.</button>
            <span className="opacity-30">•</span>
            <a href="https://kiku.is-a.dev" className="hover:text-[#A6ADC8] transition-colors">kiku.is-a.dev</a>
          </div>
        </footer>
      </div>

      <MiniPlayer audioRef={audioRef as any} />
      <Suspense fallback={null}>
        <ExpandedPlayer audioRef={audioRef as any} />
      </Suspense>
      <Suspense fallback={null}>
        <QueueDrawer />
      </Suspense>
      <Toaster />
    </div>
    <Analytics />
    </>
  )
}
