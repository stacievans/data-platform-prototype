import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { SIGNAL_CHART_CONFIG } from '../mock/signalData'

const LEFT_COLOR = '#2563eb'
const RIGHT_COLOR = '#f97316'

function LegendBar({ side, compact, legendPreset = 'arm' }) {
  if (side !== 'both') return null
  const leftLabel = legendPreset === 'gripper' ? '左夹爪' : '左臂'
  const rightLabel = legendPreset === 'gripper' ? '右夹爪' : '右臂'
  return (
    <div className={`absolute right-1.5 top-1.5 z-10 flex items-center gap-1.5 text-gray-500 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
      <span className="flex items-center gap-0.5">
        <span className="inline-block h-0 w-2.5 border-t-2 border-[#2563eb]" />
        {leftLabel}
      </span>
      <span className="flex items-center gap-0.5">
        <span className="inline-block h-0 w-2.5 border-t-2 border-dashed border-[#f97316]" />
        {rightLabel}
      </span>
    </div>
  )
}

export default function SignalChartMock({
  type = 'joint',
  data = [],
  totalFrames = 3140,
  side = 'both',
  compact = false,
  showAxes = false,
  legendPreset,
}) {
  const cfg = SIGNAL_CHART_CONFIG[type]
  const maxFrame = totalFrames - 1
  const axesVisible = showAxes || !compact
  const resolvedLegendPreset = legendPreset ?? (type === 'gripper' ? 'gripper' : 'arm')

  const yTicks = useMemo(() => {
    const [min, max] = cfg.domain
    const mid = (min + max) / 2
    return [min, mid, max]
  }, [cfg.domain])

  const margin = compact
    ? { top: axesVisible ? 18 : 6, right: 4, left: axesVisible ? -8 : -16, bottom: axesVisible ? -2 : 0 }
    : { top: 18, right: 6, left: -8, bottom: 0 }

  const formatYTick = (v) => {
    if (type === 'pose') return Number(v).toFixed(1)
    if (type === 'gripper') return Math.round(v)
    return Math.round(v)
  }

  return (
    <div className="relative h-full w-full">
      <LegendBar side={side} compact={compact} legendPreset={resolvedLegendPreset} />
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={margin}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="2 2" vertical={false} />
          {axesVisible && (
            <XAxis
              dataKey="frame"
              type="number"
              domain={[0, maxFrame]}
              tick={{ fontSize: compact ? 7 : 8, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickCount={4}
            />
          )}
          <YAxis
            domain={cfg.domain}
            ticks={yTicks}
            tickFormatter={formatYTick}
            tick={{ fontSize: compact ? 7 : 8, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            width={compact ? 28 : 32}
          />
          {side !== 'right' && (
            <Line
              type="monotone"
              dataKey="left"
              stroke={LEFT_COLOR}
              strokeWidth={compact ? 1.2 : 1.5}
              dot={false}
              isAnimationActive={false}
            />
          )}
          {side !== 'left' && (
            <Line
              type="monotone"
              dataKey="right"
              stroke={RIGHT_COLOR}
              strokeWidth={compact ? 1.2 : 1.5}
              strokeDasharray={side === 'both' ? '4 3' : undefined}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
