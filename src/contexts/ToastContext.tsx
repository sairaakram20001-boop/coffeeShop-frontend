import { createContext, useCallback, useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: number; message?: string }>).detail
      if (!detail) return

      if (detail.status === 401) notify(detail.message ?? 'Unauthorized. Please login.', 'error')
      else if (detail.status === 400) notify(detail.message ?? 'Bad request.', 'error')
      else if ((detail.status ?? 0) >= 500) notify('Server error. Try again shortly.', 'error')
    }

    window.addEventListener('api:error', handler)
    return () => window.removeEventListener('api:error', handler)
  }, [notify])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
              toast.type === 'success'
                ? 'border-green-300 bg-green-50/95 text-green-900'
                : toast.type === 'error'
                  ? 'border-red-300 bg-red-50/95 text-red-900'
                  : 'border-amber-300 bg-amber-50/95 text-amber-900'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
