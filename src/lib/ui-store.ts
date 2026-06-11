import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ConfirmState {
  message: string
  confirmLabel: string
  resolve: (ok: boolean) => void
}

interface UiStore {
  toasts: Toast[]
  notify: (message: string, type?: ToastType) => void
  dismiss: (id: number) => void
  confirmState: ConfirmState | null
  confirm: (message: string, confirmLabel?: string) => Promise<boolean>
  resolveConfirm: (ok: boolean) => void
}

let counter = 0

export const useUiStore = create<UiStore>((set, get) => ({
  toasts: [],
  notify: (message, type = 'success') => {
    const id = ++counter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().dismiss(id), 2600)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  confirmState: null,
  confirm: (message, confirmLabel = 'Sil') =>
    new Promise<boolean>((resolve) => set({ confirmState: { message, confirmLabel, resolve } })),
  resolveConfirm: (ok) => {
    const cs = get().confirmState
    if (cs) cs.resolve(ok)
    set({ confirmState: null })
  },
}))

// Hook'suz çağırmak için kısayollar (event handler'larda kullanışlı).
export const notify = (message: string, type?: ToastType) =>
  useUiStore.getState().notify(message, type)
export const confirmDialog = (message: string, confirmLabel?: string) =>
  useUiStore.getState().confirm(message, confirmLabel)
