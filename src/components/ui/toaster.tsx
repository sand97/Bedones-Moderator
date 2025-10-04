import { useToast } from "~/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "~/components/ui/toast"
import { CheckCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isSuccess = !props.variant || props.variant === "default"

        return (
          <Toast key={id} {...props}>
            <div className="flex items-start gap-3 w-full">
              {isSuccess && (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
