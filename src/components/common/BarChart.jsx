import { useState, useRef, useEffect } from 'react'

export default function BarChart({
  data,
  height = 220,
  color = '#2563eb',
  hoverColor = '#1d4ed8',
  showValues = false,
  unit = '',
  rotateLabels = false,
  yAxisLabel = '',
}) {
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
  const pad = {
    top: showValues ? 30 : 20,
    right: 16,
    bottom: rotateLabels ? 64 : 42,
    left: yAxisLabel ? 64 : 52,
  }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const max = Math.max(...data.map((d) => d.value)) * 1.15 || 1
  const gap = innerW / data.length
  const barW = Math.max(6, gap * 0.55)
  const barX = (i) => pad.left + i * gap + (gap - barW) / 2
  const barH = (v) => Math.max(2, (v / max) * innerH)
  const barY = (v) => pad.top + innerH - barH(v)

  const gridLines = 4
  const fmt = (v) =>
    v >= 10000
      ? `${(v / 10000).toFixed(1)}w`
      : v >= 1000
        ? `${(v / 1000).toFixed(1)}k`
        : String(v)

  const tooltipW = 140
  const tooltipH = 36

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHover(null)}
      >
        {/* Y-axis label */}
        {yAxisLabel && (
          <text
            x={12}
            y={pad.top + innerH / 2}
            textAnchor="middle"
            fontSize="11"
            fill="#9ca3af"
            transform={`rotate(-90 12 ${pad.top + innerH / 2})`}
          >
            {yAxisLabel}
          </text>
        )}

        {/* grid lines + y-axis ticks */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const gy = pad.top + (i / gridLines) * innerH
          const val = max * (1 - i / gridLines)
          return (
            <g key={i}>
              <line
                x1={pad.left} y1={gy}
                x2={W - pad.right} y2={gy}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray={i === gridLines ? '0' : '4 3'}
              />
              <text
                x={pad.left - 8} y={gy + 4}
                textAnchor="end" fontSize="11" fill="#9ca3af"
              >
                {fmt(val)}
              </text>
            </g>
          )
        })}

        {/* bars */}
        {data.map((d, i) => {
          const x = barX(i)
          const bh = barH(d.value)
          const by = barY(d.value)
          const active = hover === i

          /* tooltip position: clamp so it doesn't overflow right/top */
          const tx = Math.min(Math.max(x + barW / 2 - tooltipW / 2, pad.left), W - pad.right - tooltipW)
          const ty = Math.max(by - tooltipH - 8, 4)

          return (
            <g key={d.label}>
              {/* bar */}
              <rect
                x={x} y={by}
                width={barW} height={bh}
                rx="3"
                fill={active ? hoverColor : color}
                opacity={hover !== null && !active ? 0.45 : 1}
                style={{ transition: 'opacity .15s, fill .12s' }}
              />

              {/* dashed vertical guide on hover */}
              {active && (
                <line
                  x1={x + barW / 2} y1={pad.top}
                  x2={x + barW / 2} y2={pad.top + innerH}
                  stroke={color} strokeWidth="1" strokeDasharray="4 3"
                  opacity="0.5"
                />
              )}

              {/* value label on top */}
              {showValues && d.value > 0 && (
                <text
                  x={x + barW / 2} y={by - 6}
                  textAnchor="middle" fontSize="11" fill="#6b7280"
                  fontWeight="500"
                >
                  {fmt(d.value)}{unit}
                </text>
              )}

              {/* tooltip */}
              {active && (
                <g>
                  <rect
                    x={tx} y={ty}
                    width={tooltipW} height={tooltipH}
                    rx="6" fill="#1f2937" opacity="0.92"
                  />
                  {/* color dot */}
                  <circle cx={tx + 12} cy={ty + tooltipH / 2} r="4" fill={color} />
                  <text x={tx + 22} y={ty + tooltipH / 2 - 1} fontSize="11" fill="#d1d5db">
                    {d.label}
                  </text>
                  <text
                    x={tx + tooltipW - 10} y={ty + tooltipH / 2 - 1}
                    textAnchor="end" fontSize="12" fill="#fff" fontWeight="600"
                  >
                    {d.value.toLocaleString()}{unit}
                  </text>
                </g>
              )}

              {/* x label */}
              {rotateLabels ? (
                <text
                  x={x + barW / 2}
                  y={pad.top + innerH + 14}
                  fontSize="10" fill="#9ca3af" textAnchor="end"
                  transform={`rotate(-40 ${x + barW / 2} ${pad.top + innerH + 14})`}
                >
                  {d.label}
                </text>
              ) : (
                <text
                  x={x + barW / 2}
                  y={pad.top + innerH + 20}
                  textAnchor="middle" fontSize="11" fill="#9ca3af"
                >
                  {d.label}
                </text>
              )}

              {/* invisible hit area */}
              <rect
                x={x - gap * 0.2} y={pad.top}
                width={gap * 0.4 + barW + gap * 0.2} height={innerH + 20}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover(i)}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
