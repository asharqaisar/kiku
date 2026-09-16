// Dynamic SEO for track pages - updates meta when song changes (for sharing)
// Includes dynamic OG image canvas generation per track for beautiful previews
import { useEffect } from 'react'
import { usePlayer } from '../stores/player'
import { generateDynamicOgImage, updateOgImageMeta } from '../lib/ogImage'

export default function SEO() {
  const { current } = usePlayer()

  useEffect(() => {
    if (!current) {
      document.title = 'kiku. — made for late-night listening'
      return
    }

    const title = `${current.title} • ${current.artist} — kiku.`
    document.title = title

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', `Listen to ${current.title} by ${current.artist} on kiku. — beautiful music player for late-night listening. Download, lyrics, queue & more.`)
    }

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', title)

    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', `Listen to ${current.title} by ${current.artist} on kiku.`)

    const twitterTitle = document.querySelector('meta[property="twitter:title"]')
    if (twitterTitle) twitterTitle.setAttribute('content', title)

    // Default to cover first, then upgrade to dynamic canvas OG image
    const ogImage = document.querySelector('meta[property="og:image"]')
    if (ogImage) ogImage.setAttribute('content', current.cover)

    const twitterImage = document.querySelector('meta[property="twitter:image"]')
    if (twitterImage) twitterImage.setAttribute('content', current.cover)

    // Dynamic OG canvas - beautiful per-track image for WhatsApp/Twitter/Discord
    // Throttle to avoid spam
    const t = setTimeout(async () => {
      const dataUrl = await generateDynamicOgImage(current)
      if (dataUrl) updateOgImageMeta(dataUrl)
    }, 600)

    // JSON-LD for current track - use current origin (vercel.app or is-a.dev)
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kiku.vercel.app'
    let jsonLd = document.getElementById('kiku-track-jsonld')
    if (!jsonLd) {
      jsonLd = document.createElement('script')
      jsonLd.id = 'kiku-track-jsonld'
      jsonLd.type = 'application/ld+json'
      document.head.appendChild(jsonLd)
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": current.title,
      "byArtist": { "@type": "MusicGroup", "name": current.artist },
      "duration": `PT${current.durationSec}S`,
      "image": current.cover,
      "url": `${origin}/?track=${current.id}`,
      "inAlbum": { "@type": "MusicAlbum", "name": current.title },
      "genre": current.tags
    })

    return () => clearTimeout(t)
  }, [current])

  return null
}
