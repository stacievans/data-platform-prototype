import { useMemo } from 'react'
import Badge from '../../components/common/Badge'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageToolbar } from '../../components/common/ListPageCard'
import { getProjectActivities } from '../../mock/projectActivities'
import { dtCol } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'

function progressBadge(progress) {
  if (progress === '进行中') return <Badge color="blue">{progress}</Badge>
  if (progress === '完成') return <Badge color="green">{progress}</Badge>
  if (progress === '失败') return <Badge color="red">{progress}</Badge>
  return <span className="text-gray-500">{progress ?? '—'}</span>
}

export default function ActivityLogTab({ projectId }) {
  const rows = useMemo(() => getProjectActivities(projectId), [projectId])

  const columns = useMemo(() => [
    {
      title: '活动ID',
      key: 'id',
      dataIndex: 'id',
      render: (v) => <span className="font-mono text-sm text-gray-800">{v}</span>,
    },
    {
      title: '活动类型',
      key: 'type',
      dataIndex: 'type',
      render: (v) => <span className="text-gray-700">{v}</span>,
    },
    {
      title: '活动进度',
      key: 'progress',
      dataIndex: 'progress',
      render: (v) => progressBadge(v),
    },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
    {
      title: '执行人',
      key: 'executor',
      dataIndex: 'executor',
      render: (v) => <span className="text-gray-700">{v || '—'}</span>,
    },
  ], [])

  return (
    <ListPageCard>
      <ListPageToolbar>
        <h2 className="text-base font-semibold text-gray-800">活动记录</h2>
      </ListPageToolbar>
      <Table
        embedded
        columns={columns}
        dataSource={rows}
        pageSize={LIST_PAGE_SIZE}
        emptyText="暂无活动记录"
      />
    </ListPageCard>
  )
}
