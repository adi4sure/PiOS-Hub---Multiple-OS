import React, { useRef, useEffect } from 'react'

export default function ActivityLog({ logs, onClear }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight
    }
  }, [logs])

  return (
    <>
      <div className="section-header section-header--mt">
        <h2>Activity Log</h2>
        <button className="btn btn--ghost btn--sm" onClick={onClear} id="btn-clear-log">Clear</button>
      </div>
      <div className="log-panel" ref={panelRef} id="log-panel">
        <pre id="log-output">{logs.join('\n')}</pre>
      </div>
    </>
  )
}
