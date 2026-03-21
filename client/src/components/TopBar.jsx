import React from 'react'

export default function TopBar({ connected, onRefresh, onAndroid }) {
  return (
    <header className="topbar" id="topbar">
      <div className="topbar__brand">
        <div className="topbar__logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366F1"/><stop offset="1" stopColor="#A855F7"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)"/>
            <path d="M8 22V10l8-4 8 4v12l-8 4-8-4z" fill="rgba(255,255,255,.15)" stroke="white" strokeWidth="1.5"/>
            <path d="M16 6v20M8 10l8 6 8-6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="topbar__title">PiOS Hub</h1>
        <span className="topbar__badge">Raspberry Pi 5</span>
        <span className={`topbar__badge ${connected ? 'topbar__badge--online' : 'topbar__badge--offline'}`} id="conn-badge">
          {connected ? '● Online' : '○ Offline'}
        </span>
      </div>
      <div className="topbar__actions">
        <button className="btn btn--ghost" onClick={onRefresh} title="Refresh" id="btn-refresh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
        <button className="btn btn--danger" onClick={onAndroid} title="Return to Android" id="btn-android">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Android</span>
        </button>
      </div>
    </header>
  )
}
