import { useState } from 'react'
import DonutChart from '../../../components/common/DonutChart'
import MultiLineChart from '../../../components/common/MultiLineChart'
import BarChart from '../../../components/common/BarChart'
import WordCloud from '../../../components/common/WordCloud'
import { allDashboard as d } from '../../../mock/dashboard'

const SERIES = [
  { key: 'real', name: '真机自采', color: '#2563eb' },
  { key: 'open', name: '开源数据', color: '#10b981' },
]

// 紧凑指标卡
function CCard({ title, value, unit, icon, iconBg = 'bg-blue-50' }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      {icon && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base leading-none ${iconBg}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-tight text-gray-400 line-clamp-2">{title}</p>
        <div className="mt-0.5 flex items-baseline gap-0.5">
          <span className="text-lg font-bold leading-none tracking-tight text-gray-800">{value}</span>
          {unit && <span className="ml-0.5 text-[11px] text-gray-400">{unit}</span>}
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, extra, children, className = '' }) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {extra}
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange, options }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-gray-200 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`cursor-pointer px-2.5 py-1 transition-colors ${
            value === opt.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:text-blue-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function AllDataTab() {
  const [unit, setUnit] = useState('count')
  const [showValues, setShowValues] = useState(false)

  const trendData = unit === 'count' ? d.trendCount : d.trendHours

  const metrics = [
    { title: '总数据量（条数）', value: d.metrics.totalCount.toLocaleString(), unit: '条', icon: '🗄️', iconBg: 'bg-blue-50' },
    { title: '总数据量（时长）', value: d.metrics.totalHours.toLocaleString(), unit: 'h',  icon: '⏱️', iconBg: 'bg-violet-50' },
    { title: '总场景量',         value: d.metrics.scenes,                       unit: '个', icon: '🎬', iconBg: 'bg-amber-50' },
    { title: '总任务量',         value: d.metrics.tasks,                        unit: '个', icon: '📋', iconBg: 'bg-emerald-50' },
    { title: '操作技能',         value: d.metrics.skills,                       unit: '种', icon: '⚡', iconBg: 'bg-yellow-50' },
    { title: '总存储量',         value: d.metrics.storage,                      unit: '',   icon: '💾', iconBg: 'bg-slate-50' },
  ]

  return (
    <div className="space-y-4">
      {/* 第一行：紧凑指标卡，6列一行 */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {metrics.map((m) => <CCard key={m.title} {...m} />)}
      </div>

      {/* 第一行：两个环形图 50/50 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="数据资产构成">
          <div className="flex items-center justify-center py-2">
            <DonutChart data={d.assetComposition} size={170} thickness={26} />
          </div>
        </SectionCard>
        <SectionCard title="数据层级占比">
          <div className="flex items-center justify-center py-2">
            <DonutChart data={d.levelDistribution} size={170} thickness={26} />
          </div>
        </SectionCard>
      </div>

      {/* 第二行：趋势折线图 60% + 时长分布柱状图 40% */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="资产增长趋势"
          extra={
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded accent-blue-600"
                  checked={showValues}
                  onChange={(e) => setShowValues(e.target.checked)}
                />
                显示数值
              </label>
              <Toggle
                value={unit}
                onChange={setUnit}
                options={[
                  { value: 'count', label: '按条数' },
                  { value: 'hours', label: '按小时' },
                ]}
              />
            </div>
          }
        >
          <MultiLineChart data={trendData} series={SERIES} height={250} showValues={showValues} />
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          title="数据时长分布"
          extra={<span className="text-xs text-gray-400">单位：条</span>}
        >
          <BarChart
            data={d.durationDistribution}
            height={288}
            color="#8b5cf6"
            hoverColor="#7c3aed"
            showValues
          />
        </SectionCard>
      </div>

      {/* 第三行：场景与能力覆盖（单卡，左环形图 + 右词云） */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-800">场景与能力覆盖</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
              各场景数据量分布
            </p>
            <DonutChart data={d.sceneCapability} size={180} thickness={26} />
          </div>
          <div className="lg:border-l lg:border-gray-100 lg:pl-6">
            <p className="mb-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
              操作技能词云
            </p>
            <WordCloud words={d.wordCloud} height={260} />
          </div>
        </div>
      </div>
    </div>
  )
}
