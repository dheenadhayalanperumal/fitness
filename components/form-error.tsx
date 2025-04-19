import { AlertCircle } from "lucide-react"

interface FormErrorProps {
  message: string
  id?: string
}

export function FormError({ message, id }: FormErrorProps) {
  if (!message) return null

  return (
    <p id={id} className="text-sm text-destructive flex items-center gap-1 mt-1" role="alert">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  )
}
