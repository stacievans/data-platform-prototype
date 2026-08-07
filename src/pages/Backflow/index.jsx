import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Select } from '../../components/common/FormField'
import { SelectChevronWrap } from '../../components/common/SelectControl'
import { useToast } from '../../components/common/Toast'
import {
  BACKFLOW_PERIOD_OPTIONS,
  BACKFLOW_PROJECT_OPTIONS,
  getBackflowDashboard,
} from '../../mock/backflowDashboard'

const RADIAN = Math.PI / 180

/** Recharts Tooltip 原地显示，无漂移动画 */
const STATIC_TOOLTIP_PROPS = {
  isAnimationActive: false,
  animationDuration: 0,
  wrapperStyle: { outline: 'none', transition: 'none' },
}

const CHART_NO_TOOLTIP_ANIM_CLS = '[&_.recharts-tooltip-wrapper]:!transition-none'

function StatCard({ title, value, unit, icon, iconBg = 'bg-blue-50 text-blue-500' }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{title}</p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-2xl font-bold leading-none text-gray-800">{value}</span>
          {unit && <span className="text-xs text-gray-400">{unit}</span>}
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, icon, extra, children, className = '' }) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {extra}
      </div>
      {children}
    </div>
  )
}

function PeriodToggle({ value, onChange }) {
  return (
    <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1">
      {BACKFLOW_PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function MetricToggle({ value, onChange }) {
  const options = [
    { value: 'count', label: '条数' },
    { value: 'duration', label: '时长' },
  ]
  return (
    <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all ${
            value === opt.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function TrendTooltip({ active, payload, label, trendLabel }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-gray-800">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        <span className="text-gray-500">{trendLabel}</span>
        <span className="font-bold text-gray-900">{val}</span>
      </div>
    </div>
  )
}

function renderProjectLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  name,
  value,
}) {
  const radius = outerRadius + 28
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const anchor = x > cx ? 'start' : 'end'
  return (
    <text x={x} y={y} fill="#374151" textAnchor={anchor} dominantBaseline="central" fontSize={11}>
      {`${name} ${value.toLocaleString()} (${(percent * 100).toFixed(2)}%)`}
    </text>
  )
}

function IconTrend(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 18l4-6 4 3 8-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconList(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M8 6h12M8 12h12M8 18h12" strokeLinecap="round" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
    </svg>
  )
}

function IconDatabase(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  )
}

function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  )
}

function IconPie(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3v9h9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function IconBar(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 20V10M10 20V4M16 20v-6M22 20V8" strokeLinecap="round" />
    </svg>
  )
}

function IconAlert(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3L2 20h20L12 3z" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
    </svg>
  )
}

export default function BackflowPage() {
  const [period, setPeriod] = useState('7d')
  const [projectId, setProjectId] = useState('all')
  const [trendMetric, setTrendMetric] = useState('count')
  const { ToastNode, show: showToast } = useToast()

  const data = useMemo(
    () => getBackflowDashboard(projectId, period),
    [projectId, period],
  )

  const trendKey = trendMetric === 'count' ? 'count' : 'duration'
  const trendLabel = trendMetric === 'count' ? '回流条数' : '回流时长'

  const trendYMax = useMemo(() => {
    const maxVal = Math.max(...data.trend.map((d) => d[trendKey] ?? 0), 1)
    return Math.ceil(maxVal / 50) * 50
  }, [data.trend, trendKey])

  const trendYTicks = useMemo(() => {
    const step = trendYMax <= 250 ? 50 : Math.ceil(trendYMax / 5 / 100) * 100
    const ticks = []
    for (let v = 0; v <= trendYMax; v += step) ticks.push(v)
    return ticks
  }, [trendYMax])

  const handleCopySn = async (sn) => {
    try {
      await navigator.clipboard.writeText(sn)
      showToast(`已复制 ${sn}`)
    } catch {
      showToast(`SN：${sn}`)
    }
  }

  return (
    <div className={`space-y-4 ${CHART_NO_TOOLTIP_ANIM_CLS}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="shrink-0 text-lg font-semibold text-gray-800">回流看板</h2>
        <SelectChevronWrap className="w-[132px] shrink-0">
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={BACKFLOW_PROJECT_OPTIONS}
            className="h-9"
          />
        </SelectChevronWrap>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="今日回流量"
          value={data.summary.todayCount.toLocaleString()}
          unit="条"
          icon={<IconTrend />}
          iconBg="bg-sky-50 text-sky-500"
        />
        <StatCard
          title="累计回流量"
          value={data.summary.totalCount.toLocaleString()}
          unit="条"
          icon={<IconList />}
          iconBg="bg-violet-50 text-violet-500"
        />
        <StatCard
          title="总回流设备"
          value={data.summary.deviceCount}
          unit="台"
          icon={<IconBell />}
          iconBg="bg-emerald-50 text-emerald-500"
        />
        <StatCard
          title="总存储量"
          value={data.summary.storageTb}
          unit="TB"
          icon={<IconDatabase />}
          iconBg="bg-fuchsia-50 text-fuchsia-500"
        />
        <StatCard
          title="总回流时长"
          value={data.summary.durationHours.toLocaleString()}
          unit="小时"
          icon={<IconClock />}
          iconBg="bg-cyan-50 text-cyan-500"
        />
      </div>

      <PeriodToggle value={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="数据回流趋势"
          icon={<IconBar className="text-blue-500" />}
          extra={<MetricToggle value={trendMetric} onChange={setTrendMetric} />}
        >
          <div className={`h-[280px] w-full ${CHART_NO_TOOLTIP_ANIM_CLS}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="backflowTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  domain={[0, trendYMax]}
                  ticks={trendYTicks}
                />
                <Tooltip
                  {...STATIC_TOOLTIP_PROPS}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => (
                    <TrendTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      trendLabel={trendLabel}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey={trendKey}
                  name={trendLabel}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#backflowTrendFill)"
                  connectNulls
                  dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex justify-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              {trendLabel}
            </span>
          </div>
        </SectionCard>

        <SectionCard title="各项目回流占比" icon={<IconPie className="text-blue-500" />}>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.projectShare}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  labelLine
                  label={renderProjectLabel}
                >
                  {data.projectShare.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip {...STATIC_TOOLTIP_PROPS} formatter={(val) => [Number(val).toLocaleString(), '回流条数']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="单设备回流排行"
          icon={<IconBar className="text-blue-500" />}
          extra={<span className="text-xs text-gray-400">点击设备名称可复制 SN</span>}
        >
          <div className="h-[320px] overflow-y-auto pr-1">
            <ResponsiveContainer width="100%" height={Math.max(320, data.deviceRanking.length * 42)}>
              <BarChart
                layout="vertical"
                data={data.deviceRanking}
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={148}
                  tick={({ x, y, payload }) => {
                    const item = data.deviceRanking.find((d) => d.name === payload.value)
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={-8}
                          y={-2}
                          textAnchor="end"
                          fontSize={11}
                          fill="#374151"
                          className="cursor-pointer"
                          onClick={() => item && handleCopySn(item.sn)}
                        >
                          {payload.value.length > 12 ? `${payload.value.slice(0, 12)}…` : payload.value}
                        </text>
                        <text
                          x={-8}
                          y={12}
                          textAnchor="end"
                          fontSize={10}
                          fill="#9ca3af"
                          className="cursor-pointer"
                          onClick={() => item && handleCopySn(item.sn)}
                        >
                          {item?.sn}
                        </text>
                      </g>
                    )
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  {...STATIC_TOOLTIP_PROPS}
                  formatter={(val) => [Number(val).toLocaleString(), '回流条数']}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload
                    return item ? `${item.name} (${item.sn})` : ''
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="回流数据分布"
          icon={<IconAlert className="text-amber-500" />}
          extra={<span className="text-xs text-gray-500">本期上报总数: {data.periodTotal.toLocaleString()}</span>}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-center text-xs font-medium text-gray-600">上报来源分析</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.reportSource}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                    >
                      {data.reportSource.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip {...STATIC_TOOLTIP_PROPS} formatter={(val) => [Number(val).toLocaleString(), '条数']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p className="mb-2 text-center text-xs font-medium text-gray-600">问题类型分布</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.problemTypes}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={68}
                      paddingAngle={1}
                    >
                      {data.problemTypes.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip {...STATIC_TOOLTIP_PROPS} formatter={(val) => [Number(val).toLocaleString(), '条数']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {ToastNode}
    </div>
  )
}
