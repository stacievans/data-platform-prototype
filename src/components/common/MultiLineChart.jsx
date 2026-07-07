import { useState, useRef, useEffect } from 'react'

// series: [{key, name, color}]
// data: [{label, [key]: number, ...}]
export default function MultiLineChart({ data, series, height = 280, showValues = false }) {
  const [visible, setVisible] = useState(() =>
    Object.fromEntries(series.map((s) => [s.key, true])),
  )
  const [hoverIdx, setHoverIdx] = useState(null)
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
  const pad = { top: 24, right: 24, bottom: 36, left: 60 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const allVals = data.flatMap((d) =>
    series.filter((s) => visible[s.key]).map((s) => d[s.key] ?? 0),
  )
  const max = Math.max(...allVals) * 1.15 || 1

  const x = (i) => pad.left + (i / (data.length - 1)) * innerW
  const y = (v) => pad.top + innerH - (v / max) * innerH

  const fmt = (v) =>
    v >= 10000 ? `${(v / 10000).toFixed(1)}w` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v

  const toggleSeries = (key) =>
    setVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (Object.values(next).every((v) => !v)) return prev
      return next
    })

  return (
    <div ref={containerRef}>
      {/* legend */}
      <div className="mb-2 flex flex-wrap gap-4">
        {series.map((s) => (
          <button
            key={s.key}
            onClick={() => toggleSeries(s.key)}
            className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-0.5 text-xs transition-opacity ${
              visible[s.key] ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <span className="h-2.5 w-5 rounded-sm" style={{ background: s.color }} />
            <span className="text-gray-600">{s.name}</span>
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`mlc-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {/* grid */}
        {Array.from({ length: 5 }).map((_, i) => {
          const gy = pad.top + (i / 4) * innerH
          const val = max * (1 - i / 4)
          return (
            <g key={i}>
              <line x1={pad.left} y1={gy} x2={W - pad.right} y2={gy}
                stroke="#e5e7eb" strokeDasharray={i === 4 ? '0' : '4 3'} />
              <text x={pad.left - 8} y={gy + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
                {fmt(val)}
              </text>
            </g>
          )
        })}

        {/* area + line per series */}
        {series.filter((s) => visible[s.key]).map((s) => {
          const pts = data.map((d, i) => `${x(i)},${y(d[s.key] ?? 0)}`).join(' ')
          const area = `M ${x(0)},${y(data[0][s.key] ?? 0)} ` +
            data.slice(1).map((d, i) => `L ${x(i + 1)},${y(d[s.key] ?? 0)}`).join(' ') +
            ` L ${x(data.length - 1)},${pad.top + innerH} L ${x(0)},${pad.top + innerH} Z`
          return (
            <g key={s.key}>
              <path d={area} fill={`url(#mlc-${s.key})`} />
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
              {data.map((d, i) => (
                <g key={i}>
                  <circle cx={x(i)} cy={y(d[s.key] ?? 0)} r={hoverIdx === i ? 5 : 3}
                    fill="#fff" stroke={s.color} strokeWidth="2" />
                  {showValues && (
                    <text x={x(i)} y={y(d[s.key] ?? 0) - 8} textAnchor="middle" fontSize="10" fill={s.color}>
                      {fmt(d[s.key] ?? 0)}
                    </text>
                  )}
                </g>
              ))}
            </g>
          )
        })}

        {/* x labels & hover capture */}
        {data.map((d, i) => (
          <g key={d.label}>
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9ca3af">
              {d.label}
            </text>
            <rect
              x={i === 0 ? x(i) - 10 : x(i) - (x(i) - x(i - 1)) / 2}
              y={pad.top}
              width={
                i === 0 || i === data.length - 1
                  ? (x(1) - x(0)) / 2 + 10
                  : x(i + 1) - x(i - 1) === undefined ? 10 : (x(Math.min(i + 1, data.length - 1)) - x(Math.max(i - 1, 0))) / 2
              }
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          </g>
        ))}

        {/* tooltip */}
        {hoverIdx !== null && (
          <g>
            <line
              x1={x(hoverIdx)} y1={pad.top}
              x2={x(hoverIdx)} y2={pad.top + innerH}
              stroke="#d1d5db" strokeDasharray="4 3"
            />
            <rect
              x={Math.min(x(hoverIdx) + 12, W - 170)}
              y={pad.top + 4}
              width="156" height={series.filter((s) => visible[s.key]).length * 20 + 22}
              rx="6" fill="#1f2937" opacity="0.92"
            />
            <text
              x={Math.min(x(hoverIdx) + 20, W - 162)}
              y={pad.top + 22}
              fontSize="11" fill="#d1d5db"
            >
              {data[hoverIdx].label}
            </text>
            {series.filter((s) => visible[s.key]).map((s, si) => (
              <text
                key={s.key}
                x={Math.min(x(hoverIdx) + 20, W - 162)}
                y={pad.top + 42 + si * 20}
                fontSize="12" fill="#fff"
              >
                {s.name}：{(data[hoverIdx][s.key] ?? 0).toLocaleString()}
              </text>
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}
