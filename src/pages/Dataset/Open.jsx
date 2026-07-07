import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { IconGrid, IconList, IconSearch, IconLink } from '../../components/common/Icons'
import { PermButton } from '../../components/common/PermissionAction'
import { useToast } from '../../components/common/Toast'
import { getAllOpenDatasets, prependOpenDatasets } from '../../mock/datasets'
import { getOpenDatasetMetrics } from '../../utils/openDatasetMetrics'
import ImportOpenDatasetModal from './ImportOpenDatasetModal'

const LEVELS = ['全部', 'L1', 'L2', 'L3', 'L4']

const levelColor = (v) =>
  v === 'L1' ? 'purple' : v === 'L2' ? 'blue' : v === 'L3' ? 'cyan' : 'orange'

const LBL = 'mb-1 block text-xs text-gray-500'
const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function openExternalLink(e, href) {
  e.stopPropagation()
  if (href) window.open(href, '_blank', 'noopener,noreferrer')
}

function ExternalLinkIcon({ href, className = '' }) {
  if (!href) return null
  return (
    <button
      type="button"
      title="访问官网"
      onClick={(e) => openExternalLink(e, href)}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-0.5 text-blue-600 underline-offset-2 transition-colors hover:text-blue-700 hover:underline ${className}`}
    >
      <IconLink className="h-3.5 w-3.5" />
    </button>
  )
}

function DatasetNameCell({ row, onDetail }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => onDetail(row.id)}
        className="truncate text-left text-sm font-semibold text-blue-600 hover:text-blue-500"
      >
        {row.name}
      </button>
      <ExternalLinkIcon href={row.externalLink} />
    </div>
  )
}

function OpenDatasetCard({ dataset, onDetail }) {
  const { dataSize, trajCount } = getOpenDatasetMetrics(dataset)

  return (
    <div
      onClick={() => onDetail(dataset.id)}
      className="group cursor-pointer rounded-lg border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-gray-800 group-hover:text-blue-600">
              {dataset.name}
            </h3>
            <ExternalLinkIcon href={dataset.externalLink} />
          </div>
          <span className="text-xs text-gray-400">{dataset.id}</span>
        </div>
        <Badge color={levelColor(dataset.level)}>{dataset.level}</Badge>
      </div>

      <p className="mt-2 truncate text-xs text-gray-500">发布方：{dataset.publisher}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
          <div className="text-xs text-gray-400">数据量</div>
          <div className="mt-0.5 text-xs font-semibold text-gray-800">{dataSize}</div>
        </div>
        <div className="rounded-md bg-gray-50 px-2.5 py-1.5">
          <div className="text-xs text-gray-400">轨迹数量</div>
          <div className="mt-0.5 text-xs font-semibold text-gray-800">{trajCount}</div>
        </div>
      </div>
    </div>
  )
}

export default function OpenDataset() {
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState(() => getAllOpenDatasets())
  const [importOpen, setImportOpen] = useState(false)
  const [view, setView] = useState('card')
  const { ToastNode, show: showToast } = useToast()

  const [qName, setQName] = useState('')
  const [qPublisher, setQPublisher] = useState('')
  const [qLevel, setQLevel] = useState('全部')
  const [filters, setFilters] = useState({})

  const filtered = useMemo(() => {
    const { name, publisher, level } = filters
    return datasets.filter((d) => {
      if (name      && !d.name.includes(name))               return false
      if (publisher && !d.publisher.includes(publisher))       return false
      if (level     && level !== '全部' && d.level !== level) return false
      return true
    })
  }, [datasets, filters])

  const applyFilters = () => setFilters({
    name: qName, publisher: qPublisher, level: qLevel,
  })

  const resetFilters = () => {
    setQName('')
    setQPublisher('')
    setQLevel('全部')
    setFilters({})
  }

  const refreshDatasets = () => setDatasets(getAllOpenDatasets())

  const handleImport = (records) => {
    prependOpenDatasets(records)
    refreshDatasets()
    setImportOpen(false)
    showToast(`成功导入 ${records.length} 条数据集`)
  }

  const goDetail = (id) => navigate(`/dataset/open/${id}/usage`)

  const columns = [
    { title: 'ID', dataIndex: 'id' },
    {
      title: '数据集名称',
      dataIndex: 'name',
      render: (_, row) => <DatasetNameCell row={row} onDetail={goDetail} />,
    },
    { title: '发布方', dataIndex: 'publisher' },
    { title: '层级', dataIndex: 'level', render: (v) => <Badge color={levelColor(v)}>{v}</Badge> },
    { title: '数据量', dataIndex: 'size', render: (_, row) => getOpenDatasetMetrics(row).dataSize },
    { title: '轨迹数量', key: 'trajCount', render: (_, row) => getOpenDatasetMetrics(row).trajCount },
  ]

  return (
    <div className="space-y-3">
      {ToastNode}

      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>数据集名称</label>
              <input value={qName} onChange={(e) => setQName(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>发布方</label>
              <input value={qPublisher} onChange={(e) => setQPublisher(e.target.value)} placeholder="请输入" className={INPUT_CLS} />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>层级</label>
              <select value={qLevel} onChange={(e) => setQLevel(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                {LEVELS.map((l) => <option key={l} value={l}>{l === '全部' ? '全部层级' : l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" icon={<IconSearch />} onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800">开源数据集列表</h2>
          <PermButton permission="dataset.open.download" onClick={() => navigate('/dataset/open/download')}>下载数据集</PermButton>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-md border border-gray-300">
            {[{ v: 'card', icon: <IconGrid /> }, { v: 'list', icon: <IconList /> }].map(({ v, icon }) => (
              <button
                key={v}
                className={`flex h-8 w-9 cursor-pointer items-center justify-center ${
                  view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:text-blue-600'
                }`}
                onClick={() => setView(v)}
              >
                {icon}
              </button>
            ))}
          </div>
          <PermButton permission="dataset.open.import" variant="primary" onClick={() => setImportOpen(true)}>
            导入数据集
          </PermButton>
        </div>
      </div>

      {view === 'card' ? (
        <div className="grid grid-cols-4 gap-3">
          {filtered.map((d) => (
            <OpenDatasetCard key={d.id} dataset={d} onDetail={goDetail} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-gray-100 bg-white py-16 text-center text-gray-400">
              暂无符合条件的数据集
            </div>
          )}
        </div>
      ) : (
        <Table columns={columns} dataSource={filtered} />
      )}

      <ImportOpenDatasetModal
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  )
}
