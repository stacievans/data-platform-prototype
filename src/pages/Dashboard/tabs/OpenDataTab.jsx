import DonutChart from '../../../components/common/DonutChart'
import Badge from '../../../components/common/Badge'
import { openDashboard as d } from '../../../mock/dashboard'

const statusColor = { 已入库: 'green', 入库中: 'blue', 未入库: 'gray' }
const levelBg = { L1: 'bg-purple-500', L2: 'bg-sky-500', L3: 'bg-amber-500', L4: 'bg-blue-600' }

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

const metrics = [
  { title: '开源数据量（条数）', value: '743,650', unit: '条', icon: '🗄️', iconBg: 'bg-blue-50' },
  { title: '开源数据量（时长）', value: '8,827',   unit: 'h',  icon: '⏱️', iconBg: 'bg-violet-50' },
  { title: '总场景量',           value: 18,         unit: '个', icon: '🎬', iconBg: 'bg-amber-50' },
  { title: '操作技能',           value: 31,         unit: '种', icon: '⚡', iconBg: 'bg-yellow-50' },
  { title: '总存储量',           value: '23.7 TB',  unit: '',   icon: '💾', iconBg: 'bg-slate-50' },
]

export default function OpenDataTab() {
  return (
    <div className="space-y-4">
      {/* 紧凑指标卡，5 列一行 */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
        {metrics.map((m) => <CCard key={m.title} {...m} />)}
      </div>

      {/* 层级占比 40% + 最新入库动态 60% */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* 左侧：层级占比 */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">数据层级占比</h3>
          <div className="flex items-center justify-center py-2">
            <DonutChart data={d.levelDistribution} size={180} thickness={26} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
            {[
              { name: 'L1 图文视频', desc: '互联网图文、操作视频等二维数据' },
              { name: 'L2 仿真数据', desc: '仿真环境采集的合成轨迹数据' },
              { name: 'L3 第一视角', desc: '穿戴设备采集的第一视角数据' },
              { name: 'L4 真机采集', desc: '机器人本体采集的真实操作轨迹' },
            ].map((item, i) => (
              <div key={item.name} className="rounded-md bg-gray-50 p-2">
                <Badge color={['purple', 'blue', 'cyan', 'orange'][i]}>{item.name}</Badge>
                <p className="mt-1 text-[11px] leading-4 text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：最新入库动态（可滚动） */}
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm lg:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">最新入库动态</h3>
          <div className="max-h-[460px] overflow-y-auto divide-y divide-gray-100">
            {d.recentIngestion.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between py-3 pr-1 transition-colors hover:bg-blue-50/40"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${levelBg[item.level] || 'bg-blue-600'}`}
                  >
                    {item.level}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                      <span>{item.publisher}</span>
                      <span className="text-gray-200">·</span>
                      <span>{item.count}</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge color={statusColor[item.status]} dot>{item.status}</Badge>
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
