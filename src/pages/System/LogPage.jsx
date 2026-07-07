import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { IconSearch } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import { systemLogs, logActionColor } from '../../mock/misc'

const MODULES = ['全部', '采集管理', '数据集管理', '标签管理', '设备管理', '用户管理']
const ACTIONS = ['全部', '创建', '编辑', '删除', '导入', '导出', '新增', '修改', '下载']

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const DATE_CLS = `${INPUT_CLS} min-w-0 flex-1 px-2 text-xs text-gray-600`

export default function LogPage() {
  const { ToastNode, show: showToast } = useToast()

  const [qSearch,   setQSearch]   = useState('')
  const [qModule,   setQModule]   = useState('全部')
  const [qAction,   setQAction]   = useState('全部')
  const [qDateFrom, setQDateFrom] = useState('')
  const [qDateTo,   setQDateTo]   = useState('')
  const [filters, setFilters]     = useState({})

  const filtered = useMemo(() =>
    systemLogs.filter((l) => {
      const { search, module, action, dateFrom, dateTo } = filters
      if (search && !l.operator.includes(search) && !l.detail.includes(search)) return false
      if (module && module !== '全部' && l.module !== module) return false
      if (action && action !== '全部' && l.action !== action) return false
      if (dateFrom && l.time < dateFrom) return false
      if (dateTo && l.time > dateTo + ' 23:59:59') return false
      return true
    }),
    [filters],
  )

  const applyFilters = () => setFilters({
    search: qSearch.trim(),
    module: qModule,
    action: qAction,
    dateFrom: qDateFrom,
    dateTo: qDateTo,
  })

  const resetFilters = () => {
    setQSearch('')
    setQModule('全部')
    setQAction('全部')
    setQDateFrom('')
    setQDateTo('')
    setFilters({})
  }

  const columns = [
    { title: '操作时间', dataIndex: 'time', render: (v) => <span className="whitespace-nowrap text-gray-500">{v}</span> },
    { title: '操作人', dataIndex: 'operator', render: (v) => <span className="font-medium">{v}</span> },
    { title: '操作模块', dataIndex: 'module' },
    { title: '操作类型', dataIndex: 'action', render: (v) => <Badge color={logActionColor[v] ?? 'gray'}>{v}</Badge> },
    { title: '操作详情', dataIndex: 'detail', render: (v) => <span className="max-w-xs truncate block text-gray-600" title={v}>{v}</span> },
    { title: 'IP', dataIndex: 'ip', render: (v) => <span className="font-mono text-xs text-gray-500">{v}</span> },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>搜索操作人/详情</label>
              <input placeholder="请输入关键字" value={qSearch} onChange={(e) => setQSearch(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>操作模块</label>
              <select value={qModule} onChange={(e) => setQModule(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {MODULES.map((m) => <option key={m} value={m}>{m === '全部' ? '全部模块' : m}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>操作类型</label>
              <select value={qAction} onChange={(e) => setQAction(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {ACTIONS.map((a) => <option key={a} value={a}>{a === '全部' ? '全部类型' : a}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>操作时间</label>
              <div className="flex items-center gap-1">
                <input type="date" value={qDateFrom} onChange={(e) => setQDateFrom(e.target.value)} className={DATE_CLS} />
                <span className="shrink-0 text-xs text-gray-400">至</span>
                <input type="date" value={qDateTo} onChange={(e) => setQDateTo(e.target.value)} className={DATE_CLS} />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">系统日志</h2>
        <Button variant="primary" onClick={() => showToast('正在导出日志…')}>导出日志</Button>
      </div>

      <Table columns={columns} dataSource={filtered} />
      {ToastNode}
    </div>
  )
}
