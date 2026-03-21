import { useRef, useCallback, useState } from 'react'

export function useApi(addLog, addToast) {
  const [connected, setConnected] = useState(false)
  const wasConnectedRef = useRef(false)
  const firstFailRef = useRef(false)
  const connectedRef = useRef(false)

  const apiFetch = useCallback(async (endpoint, options = {}, silent = false) => {
    try {
      const res = await fetch(endpoint, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
      const data = await res.json()
      if (!wasConnectedRef.current) {
        wasConnectedRef.current = true
        connectedRef.current = true
        setConnected(true)
        addLog('✅ Connected to PiOS Hub backend.')
        addToast('Backend connected', 'success')
      }
      return data
    } catch {
      if (wasConnectedRef.current) {
        addLog('⚠️ Lost connection to backend.')
        addToast('Backend disconnected', 'error')
        wasConnectedRef.current = false
        connectedRef.current = false
        setConnected(false)
      } else if (!firstFailRef.current && !silent) {
        firstFailRef.current = true
        addLog('⏳ Waiting for backend… start the server with: python server/app.py')
      }
      return null
    }
  }, [addLog, addToast])

  return { apiFetch, connected }
}
