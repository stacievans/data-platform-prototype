import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Tabs from '../../components/common/Tabs'
import ListPageCard, { ListPageToolbar } from '../../components/common/ListPageCard'
import Badge from '../../components/common/Badge'
import {
  getConvertedDatasetById,
  getConvertedDatasetFiles,
  getLabelSubmissionRecordsByConvertedId,
} from '../../mock/datasetConversions'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { dtCol, formatDateTime } from '../../utils/formatDateTime'

const DETAIL_TABS = [
  { key: 'files', label: '文件列表' },
  { key: 'labelSubmission', label: '送标记录' },
]

const LABEL_STATUS_COLOR = {
  进行中: 'blue',
  已完成: 'green',
  失败: 'red',
}

function FilesList({ convertedId }) {
  const files = useMemo(() => getConvertedDatasetFiles(convertedId), [convertedId])

  const columns = [
    { title: '文件ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    { title: '文件名称', dataIndex: 'name', render: (v) => <span className="font-mono text-xs text-gray-800">{v}</span> },
    { title: '文件大小', dataIndex: 'size' },
    { title: '文件类型', dataIndex: 'type', render: (v) => <Badge color={v === '视频' ? 'purple' : 'cyan'}>{v}</Badge> },
    dtCol('创建时间', 'createdAt'),
  ]

  return (
    <>
      <ListPageToolbar first>
        <h3 className="text-sm font-semibold text-gray-800">数据集文件列表</h3>
        <span />
      </ListPageToolbar>

      <Table
        embedded
        columns={columns}
        dataSource={files}
        rowKey="id"
        pageSize={LIST_PAGE_SIZE}
      />
    </>
  )
}

function LabelSubmissionList({ convertedId }) {
  const records = useMemo(
    () => getLabelSubmissionRecordsByConvertedId(convertedId),
    [convertedId],
  )

  const columns = [
    {
      title: '输入数据集',
      dataIndex: 'inputDatasetName',
      wrap: true,
      render: (v) => <span className="text-gray-700">{v}</span>,
    },
    {
      title: '目标数据集',
      dataIndex: 'targetDatasetName',
      wrap: true,
      render: (v) => <span className="text-gray-700">{v}</span>,
    },
    {
      title: '送标状态',
      dataIndex: 'status',
      render: (v) => <Badge color={LABEL_STATUS_COLOR[v] ?? 'gray'} dot>{v}</Badge>,
    },
    { title: '操作人', dataIndex: 'operator' },
    dtCol('操作时间', 'operatedAt'),
  ]

  return (
    <>
      <ListPageToolbar first>
        <h3 className="text-sm font-semibold text-gray-800">送标任务列表</h3>
        <span />
      </ListPageToolbar>

      <Table
        embedded
        columns={columns}
        dataSource={records}
        rowKey="id"
        pageSize={LIST_PAGE_SIZE}
      />
    </>
  )
}

export default function ConvertedDatasetDetail() {
  const { datasetId, convertedId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('files')

  const converted = useMemo(() => getConvertedDatasetById(convertedId), [convertedId])

  if (!converted || converted.datasetId !== datasetId) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white py-20 text-center text-gray-400">
        转换数据集不存在
        <div className="mt-4">
          <Button onClick={() => navigate('/dataset/self')}>返回列表</Button>
        </div>
      </div>
    )
  }

  const metaItems = [
    ['转换数据集ID', converted.id],
    ['数据集类型', converted.type],
    ['文件数量', converted.fileCount.toLocaleString()],
    ['创建人', converted.createdBy ?? '—'],
    ['创建时间', formatDateTime(converted.createdAt)],
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 py-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">{converted.name}</h2>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {metaItems.map(([label, value]) => (
            <div key={label}>
              <div className="text-gray-400">{label}</div>
              <div className="mt-0.5 font-medium text-gray-700">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <ListPageCard>
        <div className="border-b border-gray-100 px-4 pt-4">
          <Tabs items={DETAIL_TABS} activeKey={tab} onChange={setTab} />
        </div>

        {tab === 'files' && <FilesList convertedId={converted.id} />}
        {tab === 'labelSubmission' && (
          <LabelSubmissionList convertedId={converted.id} />
        )}
      </ListPageCard>
    </div>
  )
}
