// 操作技能词云（SVG，黄金螺旋布局）
const COLORS = ['#2563eb', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1']

export default function WordCloud({ words, height = 300 }) {
  const W = 800
  const H = height
  const cx = W / 2
  const cy = H / 2

  const sorted = [...words].sort((a, b) => b.weight - a.weight)
  const maxW = sorted[0]?.weight || 1
  const minW = sorted[sorted.length - 1]?.weight || 1

  const fontSize = (w) =>
    Math.round(14 + ((w - minW) / (maxW - minW)) * 30)

  // Golden angle spiral to position words
  const placed = sorted.map((word, i) => {
    const r = Math.sqrt(i) * 44
    const theta = i * 2.3999  // golden angle ~137.5°
    const fs = fontSize(word.weight)
    const rawX = cx + r * Math.cos(theta)
    const rawY = cy + r * Math.sin(theta)
    const estHalfW = (word.text.length * fs * 0.52)
    return {
      ...word,
      x: Math.max(estHalfW + 4, Math.min(W - estHalfW - 4, rawX)),
      y: Math.max(fs, Math.min(H - 8, rawY)),
      fs,
      color: COLORS[i % COLORS.length],
      rotate: [0, 0, 0, -30, 30, 0, 0, -20, 20, 0][i % 10],
    }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="w-full">
      {placed.map((word, i) => (
        <text
          key={word.text}
          x={word.x}
          y={word.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={word.fs}
          fontWeight={word.weight > 60 ? 'bold' : 'normal'}
          fill={word.color}
          opacity="0.85"
          transform={word.rotate ? `rotate(${word.rotate} ${word.x} ${word.y})` : undefined}
          style={{ cursor: 'default', userSelect: 'none' }}
          className="transition-opacity hover:opacity-100"
        >
          {word.text}
        </text>
      ))}
    </svg>
  )
}
