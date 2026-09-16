import { motion, AnimatePresence } from 'motion/react'
import { useToast } from '../../../stores/toast'

export default function Toaster() {
  const { toasts, remove } = useToast()

  return (
    <div className="fixed bottom-[88px] sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none px-4 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', damping: 24, stiffness: 350 }}
            onClick={() => remove(t.id)}
            className="pointer-events-auto w-full px-4 py-3 rounded-2xl bg-[#1E1E2E]/90 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-3 cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'success' ? 'bg-[#CBA6F7]/15 text-[#CBA6F7]' : t.type === 'error' ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-[#A6ADC8]'}`}>
              {t.type === 'success' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5l10 -10"/></svg>
              ) : t.type === 'error' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              )}
            </div>
            <p className="text-[13px] font-sans font-medium text-[#E6E9F5] leading-tight truncate flex-1">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
