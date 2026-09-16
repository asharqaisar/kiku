import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '../services/api'

type RepeatMode = 'off' | 'all' | 'one'
type View = 'home' | 'search' | 'artist' | 'about'
type HomeTab = 'recent' | 'liked'
type DrawerTab = 'upnext' | 'lyrics' | 'related'

interface PlayerState {
  current: Track | null
  queue: Track[]
  index: number
  isPlaying: boolean
  currentTime: number
  duration: number
  buffered: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  
  tracks: Track[]
  view: View
  homeTab: HomeTab
  recent: Track[]
  liked: Track[]
  
  isModalOpen: boolean
  drawerOpen: boolean
  drawerTab: DrawerTab
  lite: boolean
  searchQuery: string
  showLyricsInExpanded: boolean

  setCurrent: (t: Track | null) => void
  setQueue: (q: Track[], idx: number) => void
  setPlaying: (b: boolean) => void
  setTime: (t: number, d: number, buf: number) => void
  setVolume: (v: number) => void
  setMuted: (m: boolean) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  setTracks: (tracks: Track[]) => void
  setView: (v: View) => void
  setHomeTab: (t: HomeTab) => void
  pushRecent: (t: Track) => void
  toggleLike: (t: Track) => void
  isLiked: (id: string) => boolean
  setModal: (b: boolean, showLyrics?: boolean) => void
  setDrawer: (open: boolean, tab?: DrawerTab) => void
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      current: null,
      queue: [],
      index: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      volume: 0.7,
      muted: false,
      shuffle: false,
      repeat: 'off',
      tracks: [],
      view: 'home',
      homeTab: 'recent',
      recent: [],
      liked: [],
      isModalOpen: false,
      drawerOpen: false,
      drawerTab: 'upnext',
      lite: false,
      searchQuery: '',
      showLyricsInExpanded: false,

      setCurrent: (current) => set({ current }),
      setQueue: (queue, index) => set({ queue, index, current: queue[index] || null }),
      setPlaying: (isPlaying) => set({ isPlaying }),
      setTime: (currentTime, duration, buffered) => set({ currentTime, duration, buffered }),
      setVolume: (volume) => set({ volume }),
      setMuted: (muted) => set({ muted }),
      toggleShuffle: () => set({ shuffle: !get().shuffle }),
      toggleRepeat: () => set({ repeat: get().repeat === 'off' ? 'all' : get().repeat === 'all' ? 'one' : 'off' }),
      setTracks: (tracks) => set({ tracks }),
      setView: (view) => set({ view }),
      setHomeTab: (homeTab) => set({ homeTab }),
      pushRecent: (t) => {
        const recent = [t, ...get().recent.filter(r => r.id !== t.id)].slice(0, 50)
        set({ recent })
      },
      toggleLike: (t) => {
        const { liked } = get()
        const exists = liked.find(x => x.id === t.id)
        set({ liked: exists ? liked.filter(x => x.id !== t.id) : [t, ...liked] })
      },
      isLiked: (id) => get().liked.some(t => t.id === id),
      setModal: (isModalOpen, showLyrics) => set({ isModalOpen, ...(showLyrics !== undefined ? { showLyricsInExpanded: showLyrics } : {}) }),
      setDrawer: (drawerOpen, drawerTab) => set({ drawerOpen, ...(drawerTab ? { drawerTab } : {}) })
    }),
    {
      name: 'kiku:store',
      partialize: (s) => ({
        recent: s.recent,
        liked: s.liked,
        volume: s.volume,
        muted: s.muted,
        shuffle: s.shuffle,
        repeat: s.repeat,
        lite: s.lite
      })
    }
  )
)
