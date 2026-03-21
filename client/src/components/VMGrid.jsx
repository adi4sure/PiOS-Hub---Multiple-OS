import React from 'react'
import VMCard from './VMCard'

export default function VMGrid({ vms, onStart, onStop, onDelete }) {
  if (!vms || vms.length === 0) {
    return (
      <div className="vm-grid" id="vm-grid">
        <div className="vm-card vm-card--empty" id="vm-empty-state">
          <div className="vm-card__empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <p>No virtual machines yet.</p>
          <p className="muted">Click "New VM" to create one.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="vm-grid" id="vm-grid">
      {vms.map((vm, i) => (
        <VMCard
          key={vm.name}
          vm={vm}
          index={i}
          onStart={() => onStart(vm.name)}
          onStop={() => onStop(vm.name)}
          onDelete={() => onDelete(vm.name)}
        />
      ))}
    </div>
  )
}
