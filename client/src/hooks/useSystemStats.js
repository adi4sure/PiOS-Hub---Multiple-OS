import { useState, useEffect, useCallback } from 'react'

export function useSystemStats(apiFetch) {
  const [stats, setStats] = useState({ cpu: {}, ram: {}, disk: {}, temperature: null })

  const fetchStats = useCallback(async () => {
    const data = await apiFetch('/api/status', {}, true)
    if (data) setStats(data)
  }, [apiFetch])

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 3000)
    return () => clearInterval(id)
  }, [fetchStats])

  return stats
}
