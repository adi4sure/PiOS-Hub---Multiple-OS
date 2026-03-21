import React from 'react'

export default function VMCard({ vm, index, onStart, onStop, onDelete }) {
  const isLinux = vm.type === 'linux'
  const icon = isLinux ? '🐧' : '🪟'
  const iconClass = isLinux ? 'vm-card__icon--linux' : 'vm-card__icon--windows'
  const isRunning = vm.status === 'running'

  return (
    <div
      className={`vm-card${isRunning ? ' vm-card--running' : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="vm-card__header">
        <div className={`vm-card__icon ${iconClass}`}>{icon}</div>
        <span className="vm-card__name">{vm.name}</span>
        <span className={`vm-card__status vm-card__status--${vm.status}`}>
          {vm.status}
        </span>
      </div>
      <div className="vm-card__meta">
        <span>💾 {vm.ram} MB</span>
        <span>🔲 {vm.cpus} vCPU</span>
        {vm.vnc_port && <span>🖥 VNC :{vm.vnc_port - 5900}</span>}
      </div>
      <div className="vm-card__actions">
        {vm.status === 'stopped' ? (
          <>
            <button className="btn btn--success btn--sm" onClick={onStart}>▶ Start</button>
            <button className="btn btn--ghost btn--sm" onClick={onDelete}>🗑 Delete</button>
          </>
        ) : (
          <>
            <button className="btn btn--danger btn--sm" onClick={onStop}>⏹ Stop</button>
            {vm.vnc_port && (
              <button className="btn btn--ghost btn--sm" onClick={() => {
                window.open(`http://${window.location.hostname}:${vm.vnc_port}`, '_blank')
              }}>🖥 VNC</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
