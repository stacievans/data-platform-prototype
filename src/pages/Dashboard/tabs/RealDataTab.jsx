import { useMemo, useState } from 'react'
import DonutChart from '../../../components/common/DonutChart'
import BarChart from '../../../components/common/BarChart'
import Progress from '../../../components/common/Progress'
import { Select } from '../../../components/common/FormField'
import Tabs from '../../../components/common/Tabs'
import { realDashboard } from '../../../mock/dashboard'
import { projects } from '../../../mock/projects'
import { tasks, pct, formatCollectors, formatReviewer } from '../../../mock/tasks'

// 紧凑卡片（支持双值：count+hours，或单值）
function CCard({ title, count, hours, value, unit, icon, iconBg = 'bg-blue-50' }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      {icon && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base leading-none ${iconBg}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-tight text-gray-400 line-clamp-2">{title}</p>
        {count !== undefined ? (
          <>
            <div className="mt-0.5 flex items-baseline gap-0.5">
              <span className="text-xl font-bold leading-none tracking-tight text-gray-800">
                {typeof count === 'number' ? count.toLocaleString() : count}
              </span>
              <span className="ml-0.5 text-[11px] text-gray-400">条</span>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {typeof hours === 'number' ? hours.toLocaleString() : hours} 小时
            </p>
          </>
        ) : (
          <div className="mt-0.5 flex items-baseline gap-0.5">
            <span className="text-xl font-bold leading-none tracking-tight text-gray-800">
              {value}
            </span>
            {unit && <span className="ml-0.5 text-[11px] text-gray-400">{unit}</span>}
          </div>
        )}
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

// 进行中任务（可滚动）
function TaskProgressTable({ projectId }) {
  const [activeTab, setActiveTab] = useState('collection')
  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (projectId === 'all' || t.projectId === projectId) &&
          (activeTab === 'collection'
            ? t.status === '已发布' && t.collectDone < t.collectTotal
            : t.status === '已发布' && t.reviewDone < t.collectTotal),
      ),
    [projectId, activeTab],
  )

  return (
    <>
      <Tabs
        items={[
          { key: 'collection', label: '采集任务' },
          { key: 'review', label: '标注任务' },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
        className="mb-3"
      />
      <div className="max-h-56 overflow-y-auto space-y-2 pr-0.5">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">暂无进行中任务</p>
        )}
        {filtered.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-md border border-gray-100 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 font-medium text-blue-600">{t.id}</span>
                <span className="truncate text-gray-700">{t.name}</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {activeTab === 'collection'
                  ? `采集员：${formatCollectors(t.collector)}`
                  : `标注员：${formatReviewer(t.reviewer)}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <Progress
                percent={pct(
                  activeTab === 'collection' ? t.collectDone : t.reviewDone,
                  t.collectTotal,
                )}
              />
              <span className="text-xs text-gray-400">
                {activeTab === 'collection'
                  ? `${t.collectDone}/${t.collectTotal}`
                  : `${t.reviewDone}/${t.collectTotal}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// 绩效排行（可滚动，支持采集员/标注员/设备三个 tab）
function RankingBoard({ ranking }) {
  const [tab, setTab] = useState('collectors')
  const list = ranking[tab] || []
  const medal = ['🥇', '🥈', '🥉']

  return (
    <>
      <Tabs
        items={[
          { key: 'collectors', label: '采集员' },
          { key: 'reviewers', label: '标注员' },
          { key: 'devices', label: '设备' },
        ]}
        activeKey={tab}
        onChange={setTab}
        className="mb-3"
      />
      <div className="max-h-56 overflow-y-auto space-y-2.5 pr-0.5">
        {list.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">暂无数据</p>
        )}
        {list.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2.5">
            <span className="w-7 shrink-0 text-center text-sm">
              {i < 3 ? medal[i] : (
                <span className="text-xs font-medium text-gray-400">{i + 1}</span>
              )}
            </span>
            <span className="w-20 shrink-0 truncate text-xs font-medium text-gray-700">
              {item.name}
            </span>
            <div className="min-w-0 flex-1">
              <Progress
                percent={Math.round((item.count / item.target) * 100)}
                color={i === 0 ? 'bg-amber-400' : 'bg-blue-500'}
              />
            </div>
            <span className="shrink-0 text-xs text-gray-500">
              {item.count.toLocaleString()}
              <span className="text-gray-300">/{item.target.toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

export default function RealDataTab({ fixedProjectId = null }) {
  const [projectId, setProjectId] = useState(fixedProjectId ?? 'all')
  const [period, setPeriod] = useState('7')
  const [unit, setUnit] = useState('count')
  const [showValues, setShowValues] = useState(false)

  const pData = realDashboard[projectId] || realDashboard['all']
  const m = pData.metrics
  const projectCount = projectId === 'all' ? projects.length : 1

  const dailyRaw = period === '7' ? pData.daily7 : pData.daily30
  const barData = dailyRaw.map((d) => ({
    label: d.label,
    value: unit === 'count' ? d.count : d.hours,
  }))

  const projectOptions = [
    { value: 'all', label: '全部项目' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]

  return (
    <div className="space-y-4">
      {/* 项目筛选（仅总看板显示，项目详情页隐藏） */}
      {fixedProjectId === null && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <span className="shrink-0 text-sm text-gray-500">所属项目：</span>
          <div className="w-60">
            <Select
              value={projectId}
              options={projectOptions}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          {projectId !== 'all' && (
            <button
              onClick={() => setProjectId('all')}
              className="cursor-pointer text-xs text-blue-600 hover:text-blue-500"
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      {/* 指标卡：4 列两行，共 8 个 */}
      <div className="grid grid-cols-4 gap-3">
        <CCard title="采集数据量" count={m.collectCount} hours={m.collectHours} icon="📥" iconBg="bg-sky-50" />
        <CCard title="审核通过量" count={m.reviewCount} hours={m.reviewHours} icon="✅" iconBg="bg-green-50" />
        <CCard title="采集项目数" value={projectCount} unit="个"           icon="📁" iconBg="bg-indigo-50" />
        <CCard title="采集任务量" value={m.tasks}        unit="个"            icon="📋" iconBg="bg-emerald-50" />
        <CCard title="操作技能"   value={m.skills}       unit="种"            icon="⚡" iconBg="bg-yellow-50" />
        <CCard title="采集设备"   value={m.devices}      unit="台"            icon="🤖" iconBg="bg-purple-50" />
        <CCard title="负责人员"   value={m.members}      unit="人"            icon="👥" iconBg="bg-orange-50" />
        <CCard title="总存储量"   value={m.storage}                           icon="💾" iconBg="bg-slate-50" />
      </div>

      {/* 第一行：任务进度（55%）+ 绩效排行（45%） */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-11">
        <SectionCard title="进行中任务" className="lg:col-span-6">
          <TaskProgressTable projectId={projectId} />
        </SectionCard>
        <SectionCard title="绩效排行榜" className="lg:col-span-5">
          <RankingBoard ranking={pData.ranking} />
        </SectionCard>
      </div>

      {/* 第二行：每日采集量（60%）+ 时长分布（40%） */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="每日采集量"
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
              <Select
                value={period}
                options={[
                  { value: '7', label: '近7日' },
                  { value: '30', label: '近30日' },
                ]}
                onChange={(e) => setPeriod(e.target.value)}
                className="!h-6 !text-xs !w-20"
              />
            </div>
          }
        >
          <BarChart
            data={barData}
            height={230}
            color="#2563eb"
            showValues={showValues}
            unit={unit === 'count' ? '' : 'h'}
            rotateLabels={period === '30'}
          />
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          title="数据时长分布"
          extra={<span className="text-xs text-gray-400">单位：条</span>}
        >
          <BarChart
            data={pData.durationDistribution}
            height={268}
            color="#10b981"
            hoverColor="#059669"
            showValues
          />
        </SectionCard>
      </div>

      {/* 第三行：4 个环形图，每行两个 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { title: '场景分布', data: pData.sceneDistribution },
          { title: '本体类型分布', data: pData.bodyDistribution },
          { title: '采集方式分布', data: pData.methodDistribution },
          { title: '末端类型分布', data: pData.endTypeDistribution },
        ].map(({ title, data }) => (
          <SectionCard key={title} title={title}>
            <div className="flex items-center justify-center py-1">
              <DonutChart data={data} size={170} thickness={24} />
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  )
}
