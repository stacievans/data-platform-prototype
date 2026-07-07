import { useState } from 'react'

export default function DonutChart({ data, size = 200, thickness = 28 }) {
  const [hover, setHover] = useState(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const cx = size / 2
  let offset = 0

  const segments = data.map((d, i) => {
    const frac = d.value / total
    const seg = { ...d, idx: i, dash: `${frac * c} ${c - frac * c}`, offset: -offset * c, frac }
    offset += frac
    return seg
  })

  const active = hover !== null ? data[hover] : null

  return (
    <div className="flex min-w-0 items-center gap-6">
      {/* SVG donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
          <defs>
            <filter id="donut-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000020" />
            </filter>
          </defs>
          {/* track ring */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {/* colored segments */}
          <g transform={`rotate(-90 ${cx} ${cx})`} filter="url(#donut-shadow)">
            {segments.map((seg) => (
              <circle
                key={seg.name}
                cx={cx} cy={cx} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={hover === seg.idx ? thickness + 5 : thickness}
                strokeDasharray={seg.dash}
                strokeDashoffset={seg.offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-width .15s', cursor: 'pointer' }}
                onMouseEnter={() => setHover(seg.idx)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
          {/* inner highlight ring – creates subtle depth */}
          <circle cx={cx} cy={cx} r={r - thickness / 2} fill="white" />
          <circle
            cx={cx} cy={cx} r={r - thickness / 2 + 1}
            fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1.5"
          />
        </svg>
        {/* center text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-gray-400 leading-tight">
            {active ? active.name : '总计'}
          </span>
          <span className="text-xl font-semibold leading-tight text-gray-800">
            {(active ? active.value : total).toLocaleString()}
          </span>
          <span className="text-[11px] text-gray-400 leading-tight">
            {active ? `${((active.value / total) * 100).toFixed(1)}%` : '条'}
          </span>
        </div>
      </div>

      {/* legend */}
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li
            key={d.name}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-50"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white"
              style={{ background: d.color, boxShadow: `0 0 0 1px ${d.color}30` }}
            />
            <span
              className={`min-w-0 flex-1 truncate text-xs transition-colors ${
                hover === i ? 'font-medium text-gray-800' : 'text-gray-500'
              }`}
            >
              {d.name}
            </span>
            <span className="shrink-0 text-xs font-medium text-gray-500">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
