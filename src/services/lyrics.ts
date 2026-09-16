// Apple Music style lyrics service - uses LRCLIB as primary (free, no key, synced)
// Falls back to JioSaavn hasLyrics flag + placeholder

export type LyricLine = {
  time: number // seconds
  text: string
}

export type LyricsResult = {
  synced: LyricLine[] | null
  plain: string | null
  source: 'lrclib' | 'jiosaavn' | 'none'
  instrumental: boolean
}

const LRCLIB_SEARCH = 'https://lrclib.net/api/search'
const LRCLIB_GET = 'https://lrclib.net/api/get'

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = []
  const regex = /\[(\d+):(\d+)\.(\d+)\](.*)/g
  let match: RegExpExecArray | null
  // Also support [mm:ss.xx] and [mm:ss]
  const regex2 = /\[(\d+):(\d+)(?:\.(\d+))?\](.*)/g
  while ((match = regex2.exec(lrc)) !== null) {
    const min = parseInt(match[1], 10)
    const sec = parseInt(match[2], 10)
    const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0
    const time = min * 60 + sec + ms / 1000
    const text = match[4].trim()
    if (text) lines.push({ time, text })
  }
  return lines.sort((a, b) => a.time - b.time)
}

export async function fetchLyrics(title: string, artist: string, duration?: number): Promise<LyricsResult> {
  const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim()
  const cleanArtist = artist.split(',')[0].trim()

  try {
    // Try LRCLIB search - most reliable for synced
    const searchUrl = `${LRCLIB_SEARCH}?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`
    const res = await fetch(searchUrl)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        // Find best match by duration if available
        let best = data[0]
        if (duration) {
          const withDuration = data.filter((d: any) => Math.abs((d.duration || 0) - duration) < 5)
          if (withDuration.length) best = withDuration[0]
        }
        // If we have synced lyrics, parse them
        if (best.syncedLyrics) {
          const synced = parseLRC(best.syncedLyrics)
          if (synced.length > 0) {
            return { synced, plain: best.plainLyrics || null, source: 'lrclib', instrumental: !!best.instrumental }
          }
        }
        if (best.plainLyrics) {
          return { synced: null, plain: best.plainLyrics, source: 'lrclib', instrumental: !!best.instrumental }
        }
        // Try get endpoint for more accurate
        if (best.id) {
          try {
            const getRes = await fetch(`https://lrclib.net/api/get/${best.id}`)
            if (getRes.ok) {
              const getData = await getRes.json()
              if (getData.syncedLyrics) {
                const synced = parseLRC(getData.syncedLyrics)
                if (synced.length) return { synced, plain: getData.plainLyrics || null, source: 'lrclib', instrumental: !!getData.instrumental }
              }
              if (getData.plainLyrics) return { synced: null, plain: getData.plainLyrics, source: 'lrclib', instrumental: !!getData.instrumental }
            }
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn('LRCLIB search failed', e)
  }

  // Fallback: try LRCLIB get with exact match
  try {
    const getUrl = `${LRCLIB_GET}?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}${duration ? `&duration=${Math.floor(duration)}` : ''}`
    const res = await fetch(getUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.syncedLyrics) {
        const synced = parseLRC(data.syncedLyrics)
        if (synced.length) return { synced, plain: data.plainLyrics || null, source: 'lrclib', instrumental: !!data.instrumental }
      }
      if (data.plainLyrics) return { synced: null, plain: data.plainLyrics, source: 'lrclib', instrumental: !!data.instrumental }
    }
  } catch {}

  return { synced: null, plain: null, source: 'none', instrumental: false }
}

// Cache to avoid refetching
const cache = new Map<string, LyricsResult>()
export async function getCachedLyrics(title: string, artist: string, duration?: number): Promise<LyricsResult> {
  const key = `${title}-${artist}`
  if (cache.has(key)) return cache.get(key)!
  const res = await fetchLyrics(title, artist, duration)
  cache.set(key, res)
  return res
}
