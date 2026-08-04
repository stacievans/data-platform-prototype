import { useMemo, useState } from 'react'
import DonutChart from '../../../components/common/DonutChart'
import BarChart from '../../../components/common/BarChart'
import Table from '../../../components/common/Table'
import { Select } from '../../../components/common/FormField'
import { realDashboard, enrichRankingList } from '../../../mock/dashboard'
import { projects } from '../../../mock/projects'
import { tasks, pct, toPeopleArray, formatReviewer } from '../../../mock/tasks'

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
      <div className="mb-3 flex items-center justify-between gap-3">
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
          type="button"
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

function SegmentToggle({ value, onChange, options }) {
  return (
    <div className="flex shrink-0 gap-1 rounded-lg bg-gray-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-all ${
            value === opt.value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function IconCheck({ className = 'h-3 w-3' }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProgressPercentCell({ done, total }) {
  const percent = total === 0 ? 0 : Math.min(100, (done / total) * 100)
  const complete = percent >= 100
  const displayPct = complete ? 100 : percent

  return (
    <div className="flex min-w-[160px] items-center gap-2">
      <div className="h-2 min-w-[88px] flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>
      {complete ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <IconCheck />
        </span>
      ) : (
        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-gray-600">
          {displayPct.toFixed(2)}%
        </span>
      )}
    </div>
  )
}

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">
        1
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white">
        2
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-400 text-xs font-bold text-white">
        3
      </span>
    )
  }
  return (
    <span className="inline-flex rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
      NO.{rank}
    </span>
  )
}

function QuantityCell({ done, total }) {
  return (
    <span className="tabular-nums">
      <span className="font-medium text-blue-600">{done.toLocaleString()}</span>
      <span className="mx-0.5 text-gray-400">/</span>
      <span className="text-gray-700">{total.toLocaleString()}</span>
    </span>
  )
}

function TaskNameCell({ id, name }) {
  return (
    <div className="min-w-[140px] text-left">
      <p className="truncate font-semibold text-gray-900">{name}</p>
      <p className="mt-0.5 text-xs text-gray-400">{id}</p>
    </div>
  )
}

function OngoingTaskSection({ projectId }) {
  const [activeTab, setActiveTab] = useState('collection')

  const rows = useMemo(() => {
    const scoped = tasks.filter((t) => projectId === 'all' || t.projectId === projectId)
    const filtered = scoped.filter((t) => {
      if (t.status !== '已发布') return false
      if (activeTab === 'collection') return t.collectDone < t.collectTotal
      return t.collectDone > 0 && t.reviewDone < t.collectDone
    })
    return filtered.map((t) => {
      const isCollection = activeTab === 'collection'
      return {
        id: t.id,
        taskId: t.id,
        name: t.name,
        person: isCollection ? (toPeopleArray(t.collector)[0] ?? '—') : formatReviewer(t.reviewer),
        done: isCollection ? t.collectDone : t.reviewDone,
        total: isCollection ? t.collectTotal : t.collectDone,
      }
    })
  }, [projectId, activeTab])

  const columns = useMemo(() => {
    const personTitle = activeTab === 'collection' ? '采集员' : '标注员'
    const qtyTitle = activeTab === 'collection' ? '采集量 / 计划量' : '标注量 / 可标注量'
    return [
      {
        title: '任务ID / 名称',
        key: 'task',
        render: (_, row) => <TaskNameCell id={row.taskId} name={row.name} />,
      },
      { title: personTitle, dataIndex: 'person' },
      {
        title: qtyTitle,
        key: 'quantity',
        render: (_, row) => <QuantityCell done={row.done} total={row.total} />,
      },
      {
        title: '进度百分比',
        key: 'progress',
        render: (_, row) => <ProgressPercentCell done={row.done} total={row.total} />,
      },
    ]
  }, [activeTab])

  return (
    <SectionCard
      title="进行中任务进度"
      extra={(
        <SegmentToggle
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'collection', label: '采集任务' },
            { value: 'review', label: '标注任务' },
          ]}
        />
      )}
    >
      <Table columns={columns} dataSource={rows} pageSize={10} scrollVisibleRows={5} bodyRowHeight={56} />
    </SectionCard>
  )
}

function formatHours(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function RankingSection({ ranking }) {
  const [tab, setTab] = useState('collectors')

  const rows = useMemo(() => {
    const list = enrichRankingList(ranking[tab] || [], tab)
    return list.map((item) => ({
      ...item,
      percent: pct(item.count, item.target),
    }))
  }, [ranking, tab])

  const personTitle = tab === 'collectors' ? '采集员' : '标注员'

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, row) => <RankBadge rank={row.rank} />,
    },
    { title: personTitle, dataIndex: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    {
      title: '完成数量',
      dataIndex: 'count',
      render: (v) => <span className="tabular-nums text-gray-800">{v.toLocaleString()}</span>,
    },
    {
      title: '完成时长（小时）',
      dataIndex: 'completeHours',
      render: (v) => <span className="tabular-nums text-gray-700">{formatHours(v)}</span>,
    },
    {
      title: '驳回数量',
      dataIndex: 'rejectCount',
      render: (v) => <span className="tabular-nums text-gray-700">{v?.toLocaleString() ?? '—'}</span>,
    },
    {
      title: '驳回时长（小时）',
      dataIndex: 'rejectHours',
      render: (v) => <span className="tabular-nums text-gray-700">{formatHours(v)}</span>,
    },
    {
      title: '完成进度',
      key: 'progress',
      render: (_, row) => <ProgressPercentCell done={row.count} total={row.target} />,
    },
  ]

  return (
    <SectionCard
      title="绩效排行榜"
      extra={(
        <SegmentToggle
          value={tab}
          onChange={setTab}
          options={[
            { value: 'collectors', label: '采集员' },
            { value: 'reviewers', label: '标注员' },
          ]}
        />
      )}
    >
      <Table columns={columns} dataSource={rows} pageSize={10} scrollVisibleRows={6} />
    </SectionCard>
  )
}

function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-100 bg-white py-24 text-center shadow-sm">
      <p className="text-sm text-gray-400">暂无统计数据</p>
    </div>
  )
}

export default function RealDataTab({ fixedProjectId = null }) {
  const [projectId, setProjectId] = useState(fixedProjectId ?? 'all')
  const [period, setPeriod] = useState('7')
  const [unit, setUnit] = useState('count')
  const [showValues, setShowValues] = useState(false)

  const scopedProjectId = fixedProjectId ?? projectId
  const pData = fixedProjectId
    ? realDashboard[fixedProjectId]
    : (realDashboard[projectId] || realDashboard.all)

  if (fixedProjectId && !pData) {
    return <DashboardEmptyState />
  }

  const m = pData.metrics
  const projectCount = scopedProjectId === 'all' ? projects.length : 1

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
              type="button"
              onClick={() => setProjectId('all')}
              className="cursor-pointer text-xs text-blue-600 hover:text-blue-500"
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        <CCard title="采集数据量" count={m.collectCount} hours={m.collectHours} icon="📥" iconBg="bg-sky-50" />
        <CCard title="标注通过量" count={m.reviewCount} hours={m.reviewHours} icon="✅" iconBg="bg-green-50" />
        <CCard title="采集项目数" value={projectCount} unit="个"           icon="📁" iconBg="bg-indigo-50" />
        <CCard title="采集任务量" value={m.tasks}        unit="个"            icon="📋" iconBg="bg-emerald-50" />
        <CCard title="操作技能"   value={m.skills}       unit="种"            icon="⚡" iconBg="bg-yellow-50" />
        <CCard title="采集设备"   value={m.devices}      unit="台"            icon="🤖" iconBg="bg-purple-50" />
        <CCard title="负责人员"   value={m.members}      unit="人"            icon="👥" iconBg="bg-orange-50" />
        <CCard title="总存储量"   value={m.storage}                           icon="💾" iconBg="bg-slate-50" />
      </div>

      <div className="space-y-4">
        <OngoingTaskSection projectId={scopedProjectId} />
        <RankingSection ranking={pData.ranking} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="每日采集量"
          extra={(
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
          )}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { title: '场景分布', data: pData.sceneDistribution },
          { title: '设备类型分布', data: pData.bodyDistribution },
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
