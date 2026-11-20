import { useEffect, useState } from 'react'
import { checkApiHealth } from '../services/api'
import type { ApiStatus } from '../types'

const CHECK_INTERVAL_MS = 60_000

/** Polls /health so the UI shows whether the backend is actually reachable. */
export function useApiStatus(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        await checkApiHealth()
        if (!cancelled) setStatus('online')
      } catch {
        if (!cancelled) setStatus('offline')
      }
    }

    check()
    const timer = window.setInterval(check, CHECK_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return status
}
