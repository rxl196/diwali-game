import { useCallback, useEffect, useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)

  const show = useCallback((text: string) => setMessage(text), [])

  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(() => setMessage(null), 1800)
    return () => window.clearTimeout(id)
  }, [message])

  return { message, show }
}
