"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} className="bg-white border border-gray-200 shadow-lg rounded-2xl">
          <div className="grid gap-1">
            {title && <ToastTitle className="text-gray-900 font-semibold">{title}</ToastTitle>}
            {description && <ToastDescription className="text-gray-600">{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose className="text-gray-400 hover:text-gray-600" />
        </Toast>
      ))}
      <ToastViewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  )
}
