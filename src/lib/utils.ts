import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function seededWave(id: string, n: number): number[] {
  let h = 2166136261
  for (const c of String(id)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0 }
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return (h % 10000) / 10000 }
  const a = 2 + rnd() * 5, b = 6 + rnd() * 9, p = rnd() * 6.283, q = rnd() * 6.283
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const x = i / Math.max(1, n - 1)
    const env = 0.35 + 0.65 * Math.sin(Math.PI * x)
    const s = 0.55 + 0.25 * Math.sin(x * a * 6.283 + p) + 0.2 * Math.sin(x * b * 6.283 + q)
    out.push(Math.min(1, Math.max(0.1, env * s * (0.7 + rnd() * 0.6))))
  }
  return out
}

export function formatTime(s: number): string {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

// Fix: Decode HTML entities like &quot; from API (seen in screenshot: "Meow Meow (From &quot;Kanthaswamy&quot;)")
export function decodeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}
