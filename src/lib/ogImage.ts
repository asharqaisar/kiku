// Dynamic OG image generator - canvas 1200x630 per track for beautiful shares
// Uses cover + title + artist + kiku branding, returns data URL and updates meta

export async function generateDynamicOgImage(track: { title: string; artist: string; cover: string }): Promise<string | null> {
  try {
    const width = 1200
    const height = 630
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Background #0E0E15
    ctx.fillStyle = '#0E0E15'
    ctx.fillRect(0, 0, width, height)

    // Soft purple glow gradients
    const g1 = ctx.createRadialGradient(width * 0.3, height * 0.2, 0, width * 0.3, height * 0.2, 600)
    g1.addColorStop(0, 'rgba(203,166,247,0.25)')
    g1.addColorStop(1, 'rgba(14,14,21,0)')
    ctx.fillStyle = g1
    ctx.fillRect(0, 0, width, height)

    const g2 = ctx.createRadialGradient(width * 0.8, height * 0.8, 0, width * 0.8, height * 0.8, 500)
    g2.addColorStop(0, 'rgba(124,58,237,0.15)')
    g2.addColorStop(1, 'rgba(14,14,21,0)')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, width, height)

    // Load cover image with CORS
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const coverUrl = track.cover

    const loadImage = (): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = coverUrl
        // timeout 3s
        setTimeout(() => reject(new Error('timeout')), 3000)
      })

    try {
      await loadImage()
      // Draw cover 500x500 centered left
      const coverSize = 420
      const x = 80
      const y = (height - coverSize) / 2
      // Rounded rect clip
      ctx.save()
      const r = 24
      ctx.beginPath()
      ctx.roundRect(x, y, coverSize, coverSize, r)
      ctx.clip()
      ctx.drawImage(img, x, y, coverSize, coverSize)
      ctx.restore()

      // Subtle border
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x, y, coverSize, coverSize, r)
      ctx.stroke()
    } catch {
      // fallback: draw placeholder
      ctx.fillStyle = '#1E1E2E'
      ctx.beginPath()
      ctx.roundRect(80, (height - 420) / 2, 420, 420, 24)
      ctx.fill()
    }

    // Text area
    const textX = 580
    ctx.fillStyle = '#EDEEF7'
    ctx.font = 'italic 600 48px "Cormorant Garamond", Georgia, serif'
    // Title - wrap to 2 lines max
    const maxWidth = width - textX - 80
    let title = track.title.length > 40 ? track.title.slice(0, 40) + '…' : track.title
    // Simple wrap
    const words = title.split(' ')
    let lines: string[] = []
    let cur = ''
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur)
        cur = w
      } else {
        cur = test
      }
      if (lines.length >= 2) break
    }
    if (cur) lines.push(cur)
    lines = lines.slice(0, 2)

    let ty = 220
    for (const line of lines) {
      ctx.fillText(line, textX, ty)
      ty += 56
    }

    ctx.fillStyle = '#A6ADC8'
    ctx.font = '400 24px Inter, sans-serif'
    let artist = track.artist.length > 36 ? track.artist.slice(0, 36) + '…' : track.artist
    ctx.fillText(artist, textX, ty + 12)

    // kiku. branding bottom
    ctx.fillStyle = '#CBA6F7'
    ctx.font = 'italic 600 28px "Cormorant Garamond", Georgia, serif'
    ctx.fillText('kiku.', textX, height - 80)

    ctx.fillStyle = '#7A7F98'
    ctx.font = '500 14px Inter, sans-serif'
    ctx.fillText('MADE FOR LATE-NIGHT LISTENING', textX + 70, height - 78)

    return canvas.toDataURL('image/png')
  } catch (e) {
    console.warn('OG gen failed', e)
    return null
  }
}

export function updateOgImageMeta(dataUrl: string) {
  const og = document.querySelector('meta[property="og:image"]')
  if (og) og.setAttribute('content', dataUrl)
  const tw = document.querySelector('meta[property="twitter:image"]')
  if (tw) tw.setAttribute('content', dataUrl)
}
