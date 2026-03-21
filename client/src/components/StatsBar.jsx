import React, { useEffect, useRef } from 'react'

const CIRCUMFERENCE = 2 * Math.PI * 34

function RingGauge({ value, gradientId, colorVar, label }) {
  const circleRef = useRef(null)
  const valRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const el = circleRef.current
    const valEl = valRef.current
    if (!el || !valEl) return

    const offset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE
    el.style.strokeDashoffset = offset

    // Animate number count-up
    const start = parseInt(valEl.textContent) || 0
    const end = Math.round(value)
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const duration = 600
    const startTime = performance.now()

    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      const current = Math.round(start + (end - start) * eased)
      valEl.textContent = `${current}%`
      if (progress < 1) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [value])

  return (
    <div className="stat-card">
      <div className="stat-card__ring">
        <svg viewBox="0 0 80 80">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientId === 'gradCPU' && <><stop stopColor="#6366f1"/><stop offset="1" stopColor="#818cf8"/></>}
              {gradientId === 'gradRAM' && <><stop stopColor="#a855f7"/><stop offset="1" stopColor="#c084fc"/></>}
              {gradientId === 'gradDisk' && <><stop stopColor="#22d3ee"/><stop offset="1" stopColor="#67e8f9"/></>}
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="34" className="ring-bg"/>
          <circle
            ref={circleRef}
            cx="40" cy="40" r="34"
            className="ring-fg"
            style={{
              stroke: `url(#${gradientId})`,
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: CIRCUMFERENCE,
            }}
          />
        </svg>
        <span className="stat-card__value" ref={valRef}>0%</span>
      </div>
      <span className="stat-card__label">{label}</span>
    </div>
  )
}

export default function StatsBar({ stats }) {
  const cpuPct = Math.round(stats.cpu?.percent ?? 0)
  const ramPct = Math.round(stats.ram?.percent ?? 0)
  const diskPct = Math.round(stats.disk?.percent ?? 0)
  const temp = stats.temperature

  return (
    <section className="stats-bar" id="stats-bar">
      <RingGauge value={cpuPct} gradientId="gradCPU" colorVar="--accent-indigo" label="CPU" />
      <RingGauge value={ramPct} gradientId="gradRAM" colorVar="--accent-purple" label="RAM" />
      <RingGauge value={diskPct} gradientId="gradDisk" colorVar="--accent-cyan" label="Disk" />
      <div className="stat-card stat-card--temp">
        <div className="stat-card__icon">🌡️</div>
        <span className="stat-card__value stat-card__value--static">
          {temp != null ? `${temp}°C` : '—'}
        </span>
        <span className="stat-card__label">Temp</span>
      </div>
    </section>
  )
}
