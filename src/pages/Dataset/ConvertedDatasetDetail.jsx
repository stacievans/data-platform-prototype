import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Drawer from '../../components/common/Drawer'
import Table from '../../components/common/Table'
import Tabs from '../../components/common/Tabs'
import ListPageCard, { ListPageToolbar } from '../../components/common/ListPageCard'
import Badge from '../../components/common/Badge'
import { DescriptionField } from '../../components/common/FormField'
import { useToast } from '../../components/common/Toast'
import { useCurrentUsername } from '../../context/AuthContext'
import {
  getConvertedDatasetById,
  getConvertedDatasetFiles,
  getLabelSubmissionRecordsByConvertedId,
  appendLabelSubmissionRecord,
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

const INPUT_CLS = 'h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const FIELD_LABEL = 'mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700'

function OneClickLabelDrawer({ open, onClose, onSubmit }) {
  const [targetDatasetId, setTargetDatasetId] = useState('')
  const [packageCount, setPackageCount] = useState('')
  const [remark, setRemark] = useState('')
  const [error, setError] = useState(false)

  const handleClose = () => {
    setTargetDatasetId('')
    setPackageCount('')
    setRemark('')
    setError(false)
    onClose()
  }

  const handleSubmit = () => {
    if (!targetDatasetId.trim()) {
      setError(true)
      return
    }
    onSubmit({
      targetDatasetId: targetDatasetId.trim(),
      packageCount: packageCount.trim(),
      remark: remark.trim(),
    })
    handleClose()
  }

  return (
    <Drawer
      open={open}
      title="一键送标"
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="确定"
    >
      <div className="space-y-4">
        <div>
          <label className={FIELD_LABEL}>
            目标数据集ID
            <span className="text-red-500">*</span>
          </label>
          <input
            value={targetDatasetId}
            onChange={(e) => {
              setTargetDatasetId(e.target.value)
              if (e.target.value.trim()) setError(false)
            }}
            placeholder="请输入标注平台的数据集ID"
            className={`${INPUT_CLS}${error ? ' border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          />
          {error && <p className="mt-1 text-xs text-red-500">请填写目标数据集ID</p>}
        </div>
        <div>
          <label className={FIELD_LABEL}>分包数量</label>
          <input
            value={packageCount}
            onChange={(e) => setPackageCount(e.target.value)}
            placeholder="请输入分包数量"
            className={INPUT_CLS}
          />
        </div>
        <DescriptionField
          label="备注"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="请输入备注"
        />
      </div>
    </Drawer>
  )
}

function FilesList({ convertedId, convertedName, onLabelSubmitted }) {
  const files = useMemo(() => getConvertedDatasetFiles(convertedId), [convertedId])
  const operator = useCurrentUsername()
  const { show, ToastNode } = useToast()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSubmit = ({ targetDatasetId, packageCount, remark }) => {
    appendLabelSubmissionRecord({
      convertedDatasetId: convertedId,
      inputDatasetName: convertedName,
      targetDatasetId,
      packageCount,
      remark,
      fileIds: files.map((f) => f.id),
      operator,
    })
    onLabelSubmitted?.()
    show('送标任务已提交')
  }

  const columns = [
    { title: '文件ID', dataIndex: 'id', render: (v) => <span className="font-medium text-gray-700">{v}</span> },
    { title: '文件名称', dataIndex: 'name', render: (v) => <span className="font-mono text-xs text-gray-800">{v}</span> },
    { title: '文件大小', dataIndex: 'size' },
    { title: '文件类型', dataIndex: 'type', render: (v) => <Badge color={v === '视频' ? 'purple' : 'cyan'}>{v}</Badge> },
    dtCol('创建时间', 'createdAt'),
  ]

  return (
    <>
      {ToastNode}
      <ListPageToolbar first>
        <h3 className="text-sm font-semibold text-gray-800">数据集文件列表</h3>
        <Button variant="primary" disabled={!files.length} onClick={() => setDrawerOpen(true)}>
          一键送标
        </Button>
      </ListPageToolbar>

      <Table
        embedded
        columns={columns}
        dataSource={files}
        rowKey="id"
        pageSize={LIST_PAGE_SIZE}
      />

      <OneClickLabelDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  )
}

function LabelSubmissionList({ convertedId, refreshKey }) {
  const records = useMemo(
    () => getLabelSubmissionRecordsByConvertedId(convertedId),
    [convertedId, refreshKey],
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
  const [labelRecordsVersion, setLabelRecordsVersion] = useState(0)

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

        {tab === 'files' && (
          <FilesList
            convertedId={converted.id}
            convertedName={converted.name}
            onLabelSubmitted={() => setLabelRecordsVersion((v) => v + 1)}
          />
        )}
        {tab === 'labelSubmission' && (
          <LabelSubmissionList convertedId={converted.id} refreshKey={labelRecordsVersion} />
        )}
      </ListPageCard>
    </div>
  )
}
