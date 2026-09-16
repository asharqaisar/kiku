// Download service - with toast feedback (premium feel, no ruin)
import { useToast } from '../stores/toast'

export async function downloadTrack(
  track: { title: string; artist: string; audioUrl: string },
  onProgress?: (busy: boolean) => void
) {
  if (!track.audioUrl) return
  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '').trim()
  const filename = `${safe(track.title)} - ${safe(track.artist)}.m4a`

  const toast = useToast.getState().push
  onProgress?.(true)
  toast(`Downloading "${track.title}"...`, 'info')
  try {
    const res = await fetch(track.audioUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: filename })
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    toast(`Saved "${track.title}" ✓`, 'success')
  } catch (err) {
    console.warn('Download blocked, opening directly:', err)
    toast(`Opening "${track.title}" in new tab`, 'info')
    window.open(track.audioUrl, '_blank')
  } finally {
    onProgress?.(false)
  }
}
