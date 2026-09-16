import { memo } from 'react'
import { usePlayer } from '../../../stores/player'

function About() {
  const { setView } = usePlayer()
  return (
    <div className="w-full flex flex-col gap-6 py-2 animate-[fadeIn_0.3s_ease]">
      <button
        onClick={() => setView('home')}
        className="self-start flex items-center gap-2 text-[11px] uppercase tracking-widest px-3 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#A6ADC8] hover:text-[#EDEEF7] hover:bg-white/10 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Back
      </button>

      <div className="rounded-[24px] bg-[#1E1E2E]/60 border border-white/[0.06] backdrop-blur-xl p-6 sm:p-8">
        <h1 className="font-serif text-[28px] sm:text-[32px] font-semibold text-[#EDEEF7] tracking-wide leading-tight" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          kiku<span className="text-[#CBA6F7] italic">.</span> — made for late-night listening
        </h1>
        <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-[#7A7F98] mt-2">About the player</p>

        <div className="mt-6 space-y-4 text-[14px] leading-[1.7] text-[#CDD6F4] font-sans">
          <p>
            <strong className="text-[#EDEEF7] font-semibold">kiku.</strong> is a beautiful, fast, mobile-first music player built for late nights.
            No ads, no clutter, no algorithmic noise — just you, your music, and a purple glow.
            Search any song, artist, or album, play instantly, download in 320kbps, and read lyrics in Apple Music-style synced view.
          </p>
          <p>
            We built kiku because most music players feel like dashboards. kiku feels like a room at 1am: dark, soft, focused.
            The UI is inspired by Linear, Stripe, and Apple Music — glass surfaces, subtle aurora, spotlight cards that follow your cursor.
            Every interaction is intentional: tap the cover to see lyrics, tap the thumb in the mini player to jump straight to lyrics, drag the queue to reorder, swipe to remove.
          </p>
          <p>
            <span className="text-[#CBA6F7] font-medium">Features:</span> Search powered by JioSaavn, lyrics via LRCLIB with Apple Music-style highlighting,
            queue like Spotify with autoplay, like and recent history persisted locally, download with toast feedback, PWA installable, offline image caching,
            keyboard shortcuts (Space, /, Q, ⌘K), waveform scrubber, and peak performance — throttled store updates, lazy-loaded heavy components, manual chunks, and Workbox caching.
          </p>
          <p>
            <span className="text-[#CBA6F7] font-medium">Tech:</span> React 19 + TypeScript, Zustand for state, Motion for animations, OGL for aurora shader,
            Tailwind v4, Vite + VitePWA, fully responsive with safe-area insets, touch gestures, and 90+ Lighthouse score.
            No trackers. No visible ads — only meta verification tags for future AdSense if needed. Your music stays yours.
          </p>
          <p>
            kiku is open-source, built by Ashar, designed for people who listen at night. If you love it, share a track — every share uses a dynamic OG image
            with cover art, title, and artist for beautiful previews on WhatsApp, Twitter, and Discord.
          </p>
          <p className="text-[#A6ADC8]/80 text-[12px] mt-2">
            Keywords: kiku music player, late night music player, free music player, apple music lyrics free, spotify alternative, jiosaavn player, download songs, pwa music player, react bits.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { k: 'Search', v: 'Millions of songs via JioSaavn API' },
            { k: 'Lyrics', v: 'Synced Apple Music-style via LRCLIB' },
            { k: 'Download', v: '320kbps with toast feedback' },
            { k: 'Queue', v: 'Drag to reorder, swipe to remove' },
            { k: 'PWA', v: 'Installable, offline images, fast' },
            { k: 'Privacy', v: 'Local history, no trackers, meta ads only' },
          ].map(f => (
            <div key={f.k} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
              <p className="text-[11px] uppercase tracking-widest text-[#CBA6F7] font-medium">{f.k}</p>
              <p className="text-[12px] text-[#A6ADC8] mt-1 leading-snug">{f.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <a href="https://kiku.is-a.dev" className="px-4 py-2 rounded-full bg-[#CBA6F7]/15 border border-[#CBA6F7]/20 text-[#CBA6F7] text-[12px] hover:bg-[#CBA6F7]/20 transition-colors">kiku.is-a.dev</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#A6ADC8] text-[12px] hover:text-[#EDEEF7] transition-colors">GitHub</a>
          <span className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#7A7F98] text-[12px]">Made with ❤️ by Ashar</span>
        </div>
      </div>

      <div className="rounded-2xl bg-[#1E1E2E]/30 border border-white/[0.04] p-4 text-[11px] text-[#7A7F98]/60 font-sans leading-relaxed">
        <p>SEO: kiku is optimized for late-night listening, free music player, apple music lyrics, spotify alternative. Dynamic OG images per track, sitemap.xml, robots.txt, JSON-LD WebApplication + MusicRecording. No visible ads, only meta tags for future monetization.</p>
      </div>
    </div>
  )
}

export default memo(About)
