'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Toast, { ToastProps } from '@/components/ui/Toast'

interface ToastContextType {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([])
  const pathname = usePathname()

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const toast = {
    success: (message: string) => addToast({ message, type: 'success' }),
    error: (message: string) => addToast({ message, type: 'error' }),
    warning: (message: string) => addToast({ message, type: 'warning' }),
    info: (message: string) => addToast({ message, type: 'info' }),
  }

  // Determine position classes based on route
  const isDashboard = pathname.startsWith('/dashboard')
  const positionClasses = isDashboard
    ? 'top-[4.75rem] right-3' // 76px top, 12px right
    : 'top-[6.375rem] right-6' // 102px top, 24px right

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Container - dynamic positioning */}
      <div
        className={`pointer-events-none fixed z-50 flex flex-col items-end gap-2 ${positionClasses}`}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
