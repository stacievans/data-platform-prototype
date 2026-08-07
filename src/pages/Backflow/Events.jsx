import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import Table from '../../components/common/Table'
import { useToast } from '../../components/common/Toast'
import { IconDownload, IconSearch } from '../../components/common/Icons'
import { SelectChevronWrap, nativeSelectChevronCls } from '../../components/common/SelectControl'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import {
  BACKFLOW_EVENT_PROJECT_OPTIONS,
  BACKFLOW_EVENT_SOURCE_OPTIONS,
  BACKFLOW_EVENT_STATUS_OPTIONS,
  BACKFLOW_EVENT_TRIGGER_OPTIONS,
  canPlayBackflowEvent,
  filterBackflowEvents,
  getBackflowEvents,
} from '../../mock/backflowEvents'

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS =
  'h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const SELECT_CLS = `h-8 w-full cursor-pointer rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-100 ${nativeSelectChevronCls}`
const DATE_CLS =
  'h-8 w-[132px] rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const FILTER_FIELD = 'min-w-0 flex-1 basis-[148px]'
const LINK_DISABLED = 'cursor-not-allowed text-sm text-gray-300'

function openPlayWorkbench(entryId) {
  window.open(`/review/${entryId}?mode=play&source=backflow`, '_blank', 'noopener,noreferrer')
}

function LevelBadge({ level }) {
  if (level === 'fatal') {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-red-500">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
          <path d="M8 1.5 14.5 13H1.5L8 1.5z" />
        </svg>
        致命
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm text-orange-500">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 5v3.5M8 11h.01" strokeLinecap="round" />
      </svg>
      严重
    </span>
  )
}

function SourceBadge({ source }) {
  if (source === 'manual') {
    return <Badge color="purple">人工上报</Badge>
  }
  return (
    <span className="inline-flex rounded border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-xs font-medium text-fuchsia-600">
      自动上报
    </span>
  )
}

function TriggerBadge({ value }) {
  return (
    <span
      className="inline-block max-w-[148px] truncate rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600"
      title={value}
    >
      {value}
    </span>
  )
}

function DataStatusBadge({ status }) {
  if (status === 'pending') return <Badge color="gray">待上传</Badge>
  if (status === 'uploading') return <Badge color="blue">上传中</Badge>
  if (status === 'failed') return <Badge color="red">上传失败</Badge>
  return <Badge color="green">已完成</Badge>
}

function UploadTimeCell({ value }) {
  if (!value) return <span className="text-gray-400">—</span>
  const [date, time] = value.split(' ')
  return (
    <div className="text-xs leading-5 text-gray-600">
      <div>{date}</div>
      <div>{time}</div>
    </div>
  )
}

function IconPlaySmall() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M7 5.5v5l4-2.5-4-2.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function BackflowEventsPage() {
  const { ToastNode, show: showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [events] = useState(() => getBackflowEvents())

  const [keywordName, setKeywordName] = useState('')
  const [trigger, setTrigger] = useState('all')
  const [projectKey, setProjectKey] = useState('all')
  const [source, setSource] = useState('all')
  const [dataStatus, setDataStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deviceSn, setDeviceSn] = useState('')
  const [deviceAlias, setDeviceAlias] = useState('')

  const [applied, setApplied] = useState({
    keywordName: '',
    trigger: 'all',
    projectKey: 'all',
    source: 'all',
    dataStatus: 'all',
    dateFrom: '',
    dateTo: '',
    deviceSn: '',
    deviceAlias: '',
  })

  useEffect(() => {
    const triggerFromUrl = searchParams.get('trigger')
    if (!triggerFromUrl) return
    setTrigger(triggerFromUrl)
    setApplied((prev) => ({ ...prev, trigger: triggerFromUrl }))
  }, [searchParams])

  const filtered = useMemo(() => filterBackflowEvents(events, applied), [events, applied])
  const pageResetKey = useMemo(() => `${JSON.stringify(applied)}:${filtered.length}`, [applied, filtered.length])

  const applyFilters = () => {
    setApplied({
      keywordName: keywordName.trim(),
      trigger,
      projectKey,
      source,
      dataStatus,
      dateFrom,
      dateTo,
      deviceSn: deviceSn.trim(),
      deviceAlias: deviceAlias.trim(),
    })
  }

  const resetFilters = () => {
    setKeywordName('')
    setTrigger('all')
    setProjectKey('all')
    setSource('all')
    setDataStatus('all')
    setDateFrom('')
    setDateTo('')
    setDeviceSn('')
    setDeviceAlias('')
    setApplied({
      keywordName: '',
      trigger: 'all',
      projectKey: 'all',
      source: 'all',
      dataStatus: 'all',
      dateFrom: '',
      dateTo: '',
      deviceSn: '',
      deviceAlias: '',
    })
  }

  const columns = [
    { title: '事件ID', dataIndex: 'id', width: 72 },
    {
      title: '事件名称',
      dataIndex: 'name',
      render: (v) => <span className="text-gray-900">{v}</span>,
    },
    {
      title: 'Trigger',
      dataIndex: 'trigger',
      render: (v) => <TriggerBadge value={v} />,
    },
    {
      title: '等级',
      dataIndex: 'level',
      render: (v) => <LevelBadge level={v} />,
    },
    { title: '触发时间', dataIndex: 'triggerTime', width: 148 },
    {
      title: '来源',
      dataIndex: 'source',
      render: (v) => <SourceBadge source={v} />,
    },
    { title: '回流设备', dataIndex: 'deviceCode' },
    { title: '设备SN', dataIndex: 'deviceSn', render: (v) => <span className="text-gray-600">{v}</span> },
    {
      title: '设备别名',
      dataIndex: 'deviceAlias',
      render: (v) => (
        <span className="block max-w-[120px] truncate text-gray-700" title={v}>
          {v}
        </span>
      ),
    },
    {
      title: '所属项目',
      dataIndex: 'project',
      render: (v) => <Badge color="gray">{v}</Badge>,
    },
    {
      title: '数据状态',
      dataIndex: 'dataStatus',
      render: (v) => <DataStatusBadge status={v} />,
    },
    {
      title: '数据大小',
      dataIndex: 'dataSizeMb',
      render: (v) => (v == null ? <span className="text-gray-400">—</span> : `${v.toFixed(1)} MB`),
    },
    {
      title: '数据时长',
      dataIndex: 'dataDurationSec',
      render: (v) => (v == null ? <span className="text-gray-400">—</span> : `${v}s`),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      render: (v) => <UploadTimeCell value={v} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, row) => {
        const playable = canPlayBackflowEvent(row)
        if (!playable) {
          return (
            <div className="flex items-center justify-center gap-3">
              <span className={LINK_DISABLED}>播放</span>
              <span className={LINK_DISABLED}>下载日志</span>
              <span className={LINK_DISABLED}>下载</span>
            </div>
          )
        }
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="link"
              size="sm"
              className="gap-1"
              onClick={() => openPlayWorkbench(row.entryId)}
            >
              <IconPlaySmall />
              播放
            </Button>
            <Button
              variant="link"
              size="sm"
              className="gap-1"
              onClick={() => showToast(`已开始下载日志：${row.name}`)}
            >
              <IconDownload className="h-3.5 w-3.5" />
              下载日志
            </Button>
            <Button
              variant="link"
              size="sm"
              className="gap-1"
              onClick={() => showToast(`已开始下载：${row.name}`)}
            >
              <IconDownload className="h-3.5 w-3.5" />
              下载
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-3">
      <ListPageCard>
        <ListPageFilter>
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <div className={FILTER_FIELD}>
                  <label className={LBL}>所属项目</label>
                  <SelectChevronWrap>
                    <select value={projectKey} onChange={(e) => setProjectKey(e.target.value)} className={SELECT_CLS}>
                      {BACKFLOW_EVENT_PROJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </SelectChevronWrap>
                </div>
                <div className={FILTER_FIELD}>
                  <label className={LBL}>来源</label>
                  <SelectChevronWrap>
                    <select value={source} onChange={(e) => setSource(e.target.value)} className={SELECT_CLS}>
                      {BACKFLOW_EVENT_SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </SelectChevronWrap>
                </div>
                <div className={FILTER_FIELD}>
                  <label className={LBL}>数据状态</label>
                  <SelectChevronWrap>
                    <select value={dataStatus} onChange={(e) => setDataStatus(e.target.value)} className={SELECT_CLS}>
                      {BACKFLOW_EVENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </SelectChevronWrap>
                </div>
                <div className={FILTER_FIELD}>
                  <label className={LBL}>设备SN</label>
                  <input
                    value={deviceSn}
                    onChange={(e) => setDeviceSn(e.target.value)}
                    placeholder="搜索设备SN"
                    className={INPUT_CLS}
                  />
                </div>
                <div className={FILTER_FIELD}>
                  <label className={LBL}>设备别名</label>
                  <input
                    value={deviceAlias}
                    onChange={(e) => setDeviceAlias(e.target.value)}
                    placeholder="搜索设备别名"
                    className={INPUT_CLS}
                  />
                </div>
                <div className={FILTER_FIELD}>
                  <label className={LBL}>事件名称</label>
                  <div className="flex">
                    <input
                      value={keywordName}
                      onChange={(e) => setKeywordName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                      placeholder="搜索事件名称"
                      className={`${INPUT_CLS} rounded-r-none`}
                    />
                    <button
                      type="button"
                      onClick={applyFilters}
                      aria-label="查询"
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-r-md border border-l-0 border-gray-200 bg-blue-600 text-white transition-colors hover:bg-blue-500"
                    >
                      <IconSearch />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className={`${FILTER_FIELD} max-w-[280px]`}>
                  <label className={LBL}>Trigger</label>
                  <SelectChevronWrap>
                    <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={SELECT_CLS}>
                      {BACKFLOW_EVENT_TRIGGER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </SelectChevronWrap>
                </div>
                <div className="shrink-0">
                  <label className={LBL}>时间</label>
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={DATE_CLS} />
                    <span className="text-xs text-gray-400">—</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={DATE_CLS} />
                  </div>
                </div>
                <div className="ml-auto flex shrink-0 items-end gap-2">
                  <Button onClick={resetFilters}>重置</Button>
                  <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="h-8 shrink-0 cursor-default whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 px-3 text-xs text-gray-500"
              aria-hidden
            >
              查看问题明细
            </button>
          </div>
        </ListPageFilter>

        <ListPageToolbar>
          <h2 className="text-base font-semibold text-gray-800">事件列表</h2>
        </ListPageToolbar>

        <Table
          embedded
          columns={columns}
          dataSource={filtered}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={pageResetKey}
        />
      </ListPageCard>

      {ToastNode}
    </div>
  )
}
