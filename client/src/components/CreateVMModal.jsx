import React, { useState, useEffect, useRef } from 'react'

export default function CreateVMModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('linux')
  const [diskSize, setDiskSize] = useState('4G')
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed, type, diskSize)
  }

  return (
    <div className="modal-overlay modal-overlay--active" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Create Virtual Machine</h3>
          <button className="btn btn--ghost btn--icon" onClick={onClose} id="btn-close-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal__body">
          <div className="form-group">
            <label htmlFor="vm-name">VM Name</label>
            <input
              ref={nameRef}
              type="text"
              id="vm-name"
              placeholder="e.g. alpine-linux"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label>Operating System Type</label>
            <div className="type-selector">
              <button
                className={`type-btn${type === 'linux' ? ' type-btn--active' : ''}`}
                onClick={() => setType('linux')}
                id="type-linux"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/>
                </svg>
                <span>Linux</span>
              </button>
              <button
                className={`type-btn${type === 'windows' ? ' type-btn--active' : ''}`}
                onClick={() => setType('windows')}
                id="type-windows"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
                  <rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>
                </svg>
                <span>Windows</span>
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="vm-disk-size">Disk Size</label>
            <select id="vm-disk-size" value={diskSize} onChange={(e) => setDiskSize(e.target.value)}>
              <option value="2G">2 GB (minimal)</option>
              <option value="4G">4 GB (recommended for Linux)</option>
              <option value="8G">8 GB</option>
              <option value="12G">12 GB (recommended for Windows)</option>
              <option value="16G">16 GB</option>
            </select>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} id="btn-confirm-create">Create VM</button>
        </div>
      </div>
    </div>
  )
}
