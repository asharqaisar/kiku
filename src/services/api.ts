const API_BASE = 'https://jioo-xi.vercel.app'

export type Track = {
  id: string
  title: string
  artist: string
  artists: { id: string | null; name: string }[]
  tags: string[]
  durationSec: number
  duration: string
  thumb: string
  thumbSrcSet: string
  cover: string
  coverSrcSet: string
  images: { quality: string; url: string }[]
  audioUrl: string
  quality: string
  radio?: boolean
}

const FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="%231E1E2E"/></svg>'
const pick = <T extends { quality: string }>(arr: T[] | undefined, q: string) => arr?.find(x => x.quality === q) ?? arr?.at(-1)
const formatTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}
const KIND_RE = /\b(lo-?fi|remix|acoustic|unplugged|live|cover|mashup|slowed|reverb|instrumental|reprise|karaoke)\b/i

function tagsOf(song: any): string[] {
  const tags: string[] = []
  const lang = String(song.language || '').toLowerCase()
  if (lang && lang !== 'unknown') tags.push(lang)
  const kind = (song.name || '').match(KIND_RE)?.[1]?.toLowerCase().replace('lo-fi', 'lofi')
  if (kind) tags.push(kind)
  if (/^\d{4}$/.test(String(song.year || ''))) tags.push(String(song.year))
  if (song.explicitContent) tags.push('explicit')
  return tags
}

function decodeHtml(str: string): string {
  if (!str) return ''
  return str.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'")
}

export function mapSong(song: any): Track {
  const dl = pick(song.downloadUrl, '320kbps')
  const artists = (song.artists?.primary || []).map((a: any) => ({ id: a.id || null, name: a.name })).filter((a: any) => a.name)
  const images = (song.image || []) as { quality: string; url: string }[]
  // Build srcset: 50w, 150w, 500w if available
  const get = (q: string) => images.find(i => i.quality === q)?.url
  const thumb = get('150x150') || get('500x500') || FALLBACK
  const cover = get('500x500') || get('150x150') || FALLBACK
  const thumbSrcSet = [
    get('50x50') ? `${get('50x50')} 50w` : null,
    get('150x150') ? `${get('150x150')} 150w` : null,
    get('500x500') ? `${get('500x500')} 500w` : null,
  ].filter(Boolean).join(', ') || `${thumb} 150w`
  const coverSrcSet = [
    get('150x150') ? `${get('150x150')} 150w` : null,
    get('500x500') ? `${get('500x500')} 500w` : null,
  ].filter(Boolean).join(', ') || `${cover} 500w`

  return {
    id: song.id,
    title: decodeHtml(song.name),
    artist: decodeHtml(artists.map((a: any) => a.name).join(', ') || 'Unknown artist'),
    artists,
    tags: tagsOf(song),
    durationSec: song.duration,
    duration: formatTime(song.duration),
    thumb,
    thumbSrcSet,
    cover,
    coverSrcSet,
    images,
    audioUrl: dl?.url || '',
    quality: dl?.quality || ''
  }
}

export async function searchSongs(query: string, signal?: AbortSignal): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/api/search/songs?query=${encodeURIComponent(query)}`, { signal })
  if (!res.ok) throw new Error(`search failed ${res.status}`)
  const data = await res.json()
  return (data.data?.results || []).map(mapSong).filter((t: Track) => t.audioUrl)
}

export async function getSuggestions(id: string, limit = 15): Promise<Track[]> {
  try {
    const res = await fetch(`${API_BASE}/api/songs/${id}/suggestions?limit=${limit}`)
    if (!res.ok) return []
    const d = await res.json()
    const arr = Array.isArray(d.data) ? d.data : (d.data?.results || [])
    return arr.map(mapSong).filter((t: Track) => t.audioUrl).map((t: Track) => ({ ...t, radio: true }))
  } catch { return [] }
}

export async function getSongById(id: string): Promise<Track | null> {
  try {
    const res = await fetch(`${API_BASE}/api/songs/${id}`)
    if (!res.ok) return null
    const d = await res.json()
    const song = d.data?.[0] || d.data
    if (!song) return null
    const mapped = mapSong(song)
    return mapped.audioUrl ? mapped : null
  } catch { return null }
}

export async function getLyrics(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/songs/${id}/lyrics`)
    if (!res.ok) return null
    const d = await res.json()
    return d.data?.lyrics ? { lyrics: d.data.lyrics, copyright: d.data?.copyright } : null
  } catch { return null }
}
