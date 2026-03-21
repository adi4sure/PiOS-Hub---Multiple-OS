import { useState, useEffect, useCallback } from 'react'

export function useVMs(apiFetch, addLog, addToast) {
  const [vms, setVMs] = useState([])

  const refresh = useCallback(async () => {
    const data = await apiFetch('/api/vms', {}, true)
    if (data) setVMs(data)
  }, [apiFetch])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 6000)
    return () => clearInterval(id)
  }, [refresh])

  const startVM = useCallback(async (name) => {
    addLog(`▶ Starting VM "${name}"…`)
    const res = await apiFetch(`/api/vms/${encodeURIComponent(name)}/start`, { method: 'POST' })
    if (res?.success) {
      addToast(`VM "${name}" started`, 'success')
      addLog(`✅ ${res.message}`)
    } else {
      addToast(res?.message || 'Failed to start', 'error')
      addLog(`❌ ${res?.message || 'Failed'}`)
    }
    refresh()
  }, [apiFetch, addLog, addToast, refresh])

  const stopVM = useCallback(async (name) => {
    addLog(`⏹ Stopping VM "${name}"…`)
    const res = await apiFetch(`/api/vms/${encodeURIComponent(name)}/stop`, { method: 'POST' })
    if (res?.success) {
      addToast(`VM "${name}" stopped`, 'success')
      addLog(`✅ ${res.message}`)
    } else {
      addToast(res?.message || 'Failed to stop', 'error')
      addLog(`❌ ${res?.message || 'Failed'}`)
    }
    refresh()
  }, [apiFetch, addLog, addToast, refresh])

  const deleteVM = useCallback(async (name) => {
    if (!window.confirm(`Delete VM "${name}" and its disk image? This cannot be undone.`)) return
    addLog(`🗑 Deleting VM "${name}"…`)
    const res = await apiFetch(`/api/vms/${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (res?.success) {
      addToast(`VM "${name}" deleted`, 'success')
      addLog(`✅ ${res.message}`)
    } else {
      addToast(res?.message || 'Failed to delete', 'error')
      addLog(`❌ ${res?.message || 'Failed'}`)
    }
    refresh()
  }, [apiFetch, addLog, addToast, refresh])

  const createVM = useCallback(async (name, type, diskSize) => {
    addLog(`📦 Creating VM "${name}" (${type}, ${diskSize})…`)
    const res = await apiFetch(`/api/vms/${encodeURIComponent(name)}/create`, {
      method: 'POST',
      body: JSON.stringify({ disk_size: diskSize, type }),
    })
    if (res?.success) {
      addToast(`VM "${name}" created`, 'success')
      addLog(`✅ ${res.message}`)
    } else {
      addToast(res?.message || 'Failed to create', 'error')
      addLog(`❌ ${res?.message || 'Failed'}`)
    }
    refresh()
  }, [apiFetch, addLog, addToast, refresh])

  return { vms, refresh, startVM, stopVM, deleteVM, createVM }
}
