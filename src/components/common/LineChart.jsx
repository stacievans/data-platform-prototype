import { useState, useRef, useEffect } from 'react'

export default function LineChart({ data, height = 260, color = '#2563eb' }) {
  const [hover, setHover] = useState(null)
  const [W, setW] = useState(600)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w > 0) setW(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const H = height
  const pad = { top: 20, right: 24, bottom: 32, left: 56 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const max = Math.max(...data.map((d) => d.value)) * 1.15
  const x = (i) => pad.left + (i / (data.length - 1)) * innerW
  const y = (v) => pad.top + innerH - (v / max) * innerH

  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')
  const areaPath = `M ${x(0)},${y(data[0].value)} ${data
    .slice(1)
    .map((d, i) => `L ${x(i + 1)},${y(d.value)}`)
    .join(' ')} L ${x(data.length - 1)},${pad.top + innerH} L ${x(0)},${
    pad.top + innerH
  } Z`

  const gridLines = 4
  const fmt = (v) =>
    v >= 10000 ? `${(v / 10000).toFixed(1)}w` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)

  return (
    <div ref={containerRef}>
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ display: 'block', overflow: 'visible' }}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const gy = pad.top + (i / gridLines) * innerH
        const val = max * (1 - i / gridLines)
        return (
          <g key={i}>
            <line
              x1={pad.left}
              y1={gy}
              x2={W - pad.right}
              y2={gy}
              stroke="#e5e7eb"
              strokeDasharray={i === gridLines ? '0' : '4 4'}
            />
            <text x={pad.left - 10} y={gy + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
              {fmt(val)}
            </text>
          </g>
        )
      })}
      <path d={areaPath} fill="url(#lc-area)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.label}>
          <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#9ca3af">
            {d.label}
          </text>
          <circle
            cx={x(i)}
            cy={y(d.value)}
            r={hover === i ? 5 : 3.5}
            fill="#fff"
            stroke={color}
            strokeWidth="2"
          />
          <rect
            x={x(i) - innerW / data.length / 2}
            y={pad.top}
            width={innerW / data.length}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        </g>
      ))}
      {hover !== null && (
        <g>
          <rect
            x={Math.min(x(hover) + 10, W - 150)}
            y={y(data[hover].value) - 38}
            width="130"
            height="34"
            rx="6"
            fill="#1f2937"
            opacity="0.92"
          />
          <text
            x={Math.min(x(hover) + 10, W - 150) + 12}
            y={y(data[hover].value) - 16}
            fontSize="12"
            fill="#fff"
          >
            {data[hover].label}：{data[hover].value.toLocaleString()} 条
          </text>
        </g>
      )}
    </svg>
    </div>
  )
}
