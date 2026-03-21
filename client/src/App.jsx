import React, { useState, useCallback, useRef, useEffect } from 'react'
import TopBar from './components/TopBar'
import StatsBar from './components/StatsBar'
import VMGrid from './components/VMGrid'
import CreateVMModal from './components/CreateVMModal'
import ActivityLog from './components/ActivityLog'
import Toast from './components/Toast'
import ParticleBackground from './components/ParticleBackground'
import { useApi } from './hooks/useApi'
import { useSystemStats } from './hooks/useSystemStats'
import { useVMs } from './hooks/useVMs'

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [logs, setLogs] = useState(['Welcome to PiOS Hub 🚀', 'Ready to manage your virtual machines.'])
  const toastIdRef = useRef(0)

  const addLog = useCallback((msg) => {
    const ts = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${ts}] ${msg}`])
  }, [])

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
    addLog('Log cleared.')
  }, [addLog])

  const { apiFetch, connected } = useApi(addLog, addToast)
  const stats = useSystemStats(apiFetch)
  const { vms, refresh: refreshVMs, startVM, stopVM, deleteVM, createVM } = useVMs(apiFetch, addLog, addToast)

  const handleCreate = useCallback(async (name, type, diskSize) => {
    setModalOpen(false)
    await createVM(name, type, diskSize)
  }, [createVM])

  const handleRefresh = useCallback(() => {
    refreshVMs()
  }, [refreshVMs])

  const handleReturnToAndroid = useCallback(async () => {
    if (!window.confirm('Stop all VMs and return to Android?')) return
    addLog('🏠 Returning to Android… stopping all VMs.')
    addToast('Stopping VMs and returning to Android…', 'info')
    const running = vms.filter(v => v.status === 'running')
    await Promise.all(running.map(v =>
      apiFetch(`/api/vms/${encodeURIComponent(v.name)}/stop`, { method: 'POST' })
    ))
    addLog('✅ All VMs stopped. You can close this browser tab.')
    addToast('All VMs stopped. Return to Android home screen.', 'success')
  }, [vms, apiFetch, addLog, addToast])

  return (
    <>
      <ParticleBackground />
      <TopBar connected={connected} onRefresh={handleRefresh} onAndroid={handleReturnToAndroid} />
      <StatsBar stats={stats} />
      <main className="main">
        <div className="section-header">
          <h2>Virtual Machines</h2>
          <button className="btn btn--primary" onClick={() => setModalOpen(true)} id="btn-create-vm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>New VM</span>
          </button>
        </div>
        <VMGrid vms={vms} onStart={startVM} onStop={stopVM} onDelete={deleteVM} />
        <ActivityLog logs={logs} onClear={clearLogs} />
      </main>
      {modalOpen && <CreateVMModal onClose={() => setModalOpen(false)} onCreate={handleCreate} />}
      <Toast toasts={toasts} />
    </>
  )
}
