import StatCard from '../../components/common/StatCard'
import LineChart from '../../components/common/LineChart'
import DonutChart from '../../components/common/DonutChart'
import {
  IconDataset,
  IconCollection,
  IconTag,
  IconDevice,
  IconDashboard,
  IconUpload,
} from '../../components/common/Icons'

const cardDefs = [
  { key: 'total', title: '总数据量', unit: '条', icon: <IconDataset />, iconBg: 'bg-blue-50 text-blue-600', trend: 12.4 },
  { key: 'duration', title: '总时长', unit: '', icon: <IconDashboard />, iconBg: 'bg-cyan-50 text-cyan-600', trend: 8.6 },
  { key: 'scenes', title: '场景数', unit: '个', icon: <IconDevice />, iconBg: 'bg-purple-50 text-purple-600', trend: 4.2 },
  { key: 'tasks', title: '任务数', unit: '个', icon: <IconCollection />, iconBg: 'bg-emerald-50 text-emerald-600', trend: 15.8 },
  { key: 'skills', title: '操作技能', unit: '种', icon: <IconTag />, iconBg: 'bg-amber-50 text-amber-600', trend: 5.3 },
  { key: 'storage', title: '总存储量', unit: '', icon: <IconUpload />, iconBg: 'bg-rose-50 text-rose-600', trend: 10.1 },
]

export default function DashboardPanel({ data, distributionTitle = '数据场景分布' }) {
  const { metrics, trend, distribution } = data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cardDefs.map((def) => (
          <StatCard
            key={def.key}
            title={def.title}
            value={
              typeof metrics[def.key] === 'number'
                ? metrics[def.key].toLocaleString()
                : metrics[def.key]
            }
            unit={def.unit}
            icon={def.icon}
            iconBg={def.iconBg}
            trend={def.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">数据量趋势</h3>
            <span className="text-xs text-gray-400">单位：条</span>
          </div>
          <LineChart data={trend} />
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="mb-3 text-base font-semibold text-gray-800">{distributionTitle}</h3>
          <div className="flex h-[260px] items-center justify-center">
            <DonutChart data={distribution} />
          </div>
        </div>
      </div>
    </div>
  )
}
