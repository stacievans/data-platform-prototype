import { useMemo, useState } from 'react'
import Badge from '../../components/common/Badge'
import ListPageCard, { ListPageFilter } from '../../components/common/ListPageCard'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import { IconCheck, IconClose, IconDevice, IconPencil, IconSearch } from '../../components/common/Icons'
import { SelectChevronWrap } from '../../components/common/SelectControl'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import {
  BACKFLOW_DEVICE_PROJECT_OPTIONS,
  BACKFLOW_DEVICE_SEARCH_FIELDS,
  filterBackflowDevices,
  getBackflowDevices,
  updateBackflowDeviceAlias,
} from '../../mock/backflowDevices'

const SELECT_INNER_CLS =
  'h-full w-full cursor-pointer appearance-none border-0 bg-transparent py-0 pl-3 pr-7 text-sm text-gray-700 outline-none'

function AliasCell({ row, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(row.alias)

  const commit = () => {
    onSave(row.id, draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(row.alias)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="inline-flex max-w-full items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          className="h-8 w-[128px] max-w-full rounded-md border border-blue-400 px-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          aria-label="确定"
          onClick={commit}
          className="cursor-pointer rounded p-0.5 text-emerald-500 transition-colors hover:text-emerald-600"
        >
          <IconCheck className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          aria-label="取消"
          onClick={cancel}
          className="cursor-pointer rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
        >
          <IconClose className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      </div>
    )
  }

  return (
    <div className="group/alias inline-flex max-w-full items-center justify-center gap-1.5">
      <span className="truncate text-gray-700">{row.alias?.trim() ? row.alias : '—'}</span>
      <button
        type="button"
        aria-label="编辑设备别名"
        onClick={() => {
          setDraft(row.alias)
          setEditing(true)
        }}
        className="invisible shrink-0 cursor-pointer rounded p-0.5 text-gray-400 transition-colors hover:text-blue-600 group-hover/alias:visible"
      >
        <IconPencil />
      </button>
    </div>
  )
}

function DeviceRulesModal({ open, device, onClose }) {
  if (!device) return null

  return (
    <Modal
      open={open}
      title={(
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <IconDevice />
          </span>
          <span>设备生效规则详情 - {device.code}</span>
        </span>
      )}
      onCancel={onClose}
      footer={null}
      width={760}
    >
      <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <span>
          <span className="text-gray-500">设备别名：</span>
          {device.alias?.trim() ? device.alias : '—'}
        </span>
        <span>
          <span className="text-gray-500">设备SN：</span>
          {device.sn}
        </span>
        <span>
          <span className="text-gray-500">系统版本：</span>
          {device.systemVersion?.trim() ? device.systemVersion : '—'}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="bg-gray-50 text-center text-gray-600">
              <th className="whitespace-nowrap px-4 py-3 font-medium">规则ID</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Trigger 标识</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">生效时间</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">活跃状态</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {device.rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  暂无生效规则
                </td>
              </tr>
            ) : (
              device.rules.map((rule, index) => (
                <tr key={rule.id} className={`border-t border-gray-100 ${index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}`}>
                  <td className="px-4 py-3 text-center text-gray-700">{rule.id}</td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-gray-700">{rule.trigger}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{rule.effectiveAt}</td>
                  <td className="px-4 py-3 text-center">
                    {rule.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        生效中
                      </span>
                    ) : (
                      <span className="text-gray-400">已停用</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rule.status === 'active' ? (
                      <button type="button" className="cursor-pointer text-sm text-orange-500 hover:text-orange-400">
                        停用
                      </button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

export default function BackflowDevicesPage() {
  const [devices, setDevices] = useState(() => getBackflowDevices())
  const [searchField, setSearchField] = useState('code')
  const [keyword, setKeyword] = useState('')
  const [projectKey, setProjectKey] = useState('all')
  const [applied, setApplied] = useState({ searchField: 'code', keyword: '', projectKey: 'all' })
  const [rulesDevice, setRulesDevice] = useState(null)

  const filtered = useMemo(
    () => filterBackflowDevices(devices, applied),
    [devices, applied],
  )

  const pageResetKey = useMemo(
    () => `${JSON.stringify(applied)}:${filtered.length}`,
    [applied, filtered.length],
  )

  const applyFilters = () => {
    setApplied({
      searchField,
      keyword: keyword.trim(),
      projectKey,
    })
  }

  const handleAliasSave = (id, alias) => {
    updateBackflowDeviceAlias(id, alias)
    setDevices(getBackflowDevices())
  }

  const columns = [
    {
      title: '设备名称',
      dataIndex: 'code',
      render: (v) => <span className="text-gray-900">{v}</span>,
    },
    {
      title: '设备别名',
      dataIndex: 'alias',
      width: 200,
      render: (_, row) => <AliasCell row={row} onSave={handleAliasSave} />,
    },
    {
      title: '设备SN',
      dataIndex: 'sn',
      render: (v) => <span className="text-gray-600">{v}</span>,
    },
    {
      title: '配置的回流规则',
      dataIndex: 'ruleCount',
      render: (count, row) => {
        if (!count) return <span className="text-gray-400">—</span>
        return (
          <button
            type="button"
            onClick={() => setRulesDevice(row)}
            className="cursor-pointer rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
          >
            {count} 条规则
          </button>
        )
      },
    },
    {
      title: '系统版本',
      dataIndex: 'systemVersion',
      render: (v) => (
        <span className="text-gray-400">{v?.trim() ? v : '—'}</span>
      ),
    },
    {
      title: '所属项目',
      dataIndex: 'project',
      render: (v) => <Badge color="purple">{v}</Badge>,
    },
  ]

  return (
    <div className="space-y-3">
      <ListPageCard>
        <ListPageFilter>
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex h-9 items-stretch overflow-hidden rounded-md border border-gray-200 bg-white">
              <SelectChevronWrap className="relative shrink-0 border-r border-gray-200">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className={SELECT_INNER_CLS}
                >
                  {BACKFLOW_DEVICE_SEARCH_FIELDS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </SelectChevronWrap>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="请输入关键字"
                className="h-full w-56 border-0 bg-transparent px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:ring-0"
              />
              <button
                type="button"
                onClick={applyFilters}
                aria-label="查询"
                className="flex h-full w-9 shrink-0 cursor-pointer items-center justify-center bg-blue-600 text-white transition-colors hover:bg-blue-500"
              >
                <IconSearch />
              </button>
            </div>

            <SelectChevronWrap className="relative h-9 w-[132px] shrink-0 rounded-md border border-gray-200 bg-white">
              <select
                value={projectKey}
                onChange={(e) => {
                  const next = e.target.value
                  setProjectKey(next)
                  setApplied((prev) => ({ ...prev, projectKey: next }))
                }}
                className={SELECT_INNER_CLS}
              >
                {BACKFLOW_DEVICE_PROJECT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </SelectChevronWrap>
          </div>
        </ListPageFilter>

        <Table
          embedded
          columns={columns}
          dataSource={filtered}
          pageSize={LIST_PAGE_SIZE}
          pageResetKey={pageResetKey}
        />
      </ListPageCard>

      <DeviceRulesModal
        open={!!rulesDevice}
        device={rulesDevice}
        onClose={() => setRulesDevice(null)}
      />
    </div>
  )
}
