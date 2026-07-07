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

function LegendBar() {
  return (
    <div className="absolute right-2 top-1.5 z-10 flex items-center gap-2 text-[9px] text-gray-500">
      <span className="flex items-center gap-0.5">
        <span className="inline-block h-0 w-3 border-t-2 border-[#2563eb]" />
        左臂
      </span>
      <span className="flex items-center gap-0.5">
        <span className="inline-block h-0 w-3 border-t-2 border-dashed border-[#f97316]" />
        右臂
      </span>
    </div>
  )
}

export default function SignalChartMock({ type = 'joint', data = [], totalFrames = 3140 }) {
  const cfg = SIGNAL_CHART_CONFIG[type]
  const maxFrame = totalFrames - 1

  const yTicks = useMemo(() => {
    const [min, max] = cfg.domain
    const mid = (min + max) / 2
    return [min, mid, max]
  }, [cfg.domain])

  return (
    <div className="relative h-full w-full">
      <LegendBar />
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 18, right: 6, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="2 2" vertical={false} />
          <XAxis
            dataKey="frame"
            type="number"
            domain={[0, maxFrame]}
            tick={{ fontSize: 8, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickCount={4}
          />
          <YAxis
            domain={cfg.domain}
            ticks={yTicks}
            tick={{ fontSize: 8, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            width={32}
          />
          <Line
            type="monotone"
            dataKey="left"
            stroke={LEFT_COLOR}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="right"
            stroke={RIGHT_COLOR}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
