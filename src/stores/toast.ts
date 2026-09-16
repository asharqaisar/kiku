import { create } from 'zustand'

type Toast = {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, type?: Toast['type']) => void
  remove: (id: string) => void
}

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, message, type }
    set({ toasts: [...get().toasts, toast] })
    // auto remove after 3s
    setTimeout(() => get().remove(id), 3000)
  },
  remove: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) })
}))
