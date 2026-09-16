import { usePlayer } from '../stores/player'
import { getSuggestions } from '../services/api'
import { useCallback } from 'react'

export function usePlayerControls(audioRef: React.RefObject<HTMLAudioElement>) {
  const { queue, index, current, pushRecent } = usePlayer()

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    if (audio.paused) {
      audio.play().catch(console.warn)
    } else {
      audio.pause()
    }
  }, [audioRef, current])

  const playNext = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || queue.length === 0) return

    let nextIdx = index + 1

    // If at end, fetch autoplay suggestions like Spotify
    if (nextIdx >= queue.length) {
      if (current) {
        const more = await getSuggestions(current.id, 15)
        if (more.length) {
          const filtered = more.filter(m => !queue.some(q => q.id === m.id))
          if (filtered.length) {
            const newQueue = [...queue, ...filtered]
            usePlayer.setState({ queue: newQueue })
            nextIdx = index + 1
          } else {
            // loop if repeat all
            const { repeat } = usePlayer.getState()
            if (repeat === 'all') nextIdx = 0
            else return
          }
        } else {
          const { repeat } = usePlayer.getState()
          if (repeat === 'all') nextIdx = 0
          else return
        }
      } else return
    }

    const nextTrack = usePlayer.getState().queue[nextIdx]
    if (nextTrack && audio) {
      usePlayer.setState({ index: nextIdx, current: nextTrack })
      audio.src = nextTrack.audioUrl
      audio.play().catch(console.warn)
      pushRecent(nextTrack)
    }
  }, [audioRef, queue, index, current, pushRecent])

  const playPrev = useCallback(() => {
    const audio = audioRef.current
    if (!audio || queue.length === 0) return

    // If >3s into song, restart (like Spotify)
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }

    const prevIdx = (index - 1 + queue.length) % queue.length
    const prevTrack = queue[prevIdx]
    if (prevTrack) {
      usePlayer.setState({ index: prevIdx, current: prevTrack })
      audio.src = prevTrack.audioUrl
      audio.play().catch(console.warn)
      pushRecent(prevTrack)
    }
  }, [audioRef, queue, index, pushRecent])

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current
    if (audio?.duration) audio.currentTime = pct * audio.duration
  }, [audioRef])

  return { togglePlay, playNext, playPrev, seek }
}
