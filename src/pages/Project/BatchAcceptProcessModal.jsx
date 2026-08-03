import { useEffect, useState } from 'react'
import Modal from '../../components/common/Modal'
import {
  CHECKBOX_LIST_CLS,
  CheckboxListSelectAllRow,
  CheckboxListShell,
} from '../../components/common/CheckboxList'
import { calcSampledCount, formatSamplingFiltersSummary } from '../../utils/samplingHelpers'

const LBL = 'mb-1.5 block text-sm text-gray-700'
const HINT = 'text-xs text-gray-400'
const TEXTAREA_CLS =
  'w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const REMARK_MAX = 500

function ActionRadio({ value, active, onChange, label }) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-600'
          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
      }`}
    >
      <input type="radio" checked={active} onChange={() => onChange(value)} className="text-blue-600" />
      {label}
    </label>
  )
}

export default function BatchAcceptProcessModal({ open, batch, onCancel, onConfirm }) {
  const [selectedKeys, setSelectedKeys] = useState(() => new Set())
  const [action, setAction] = useState('pass')
  const [remark, setRemark] = useState('')
  const [remarkError, setRemarkError] = useState(false)

  const configItems = batch?.configItems ?? []

  useEffect(() => {
    if (open && batch) {
      setSelectedKeys(new Set(configItems.map((i) => i.key)))
      setAction('pass')
      setRemark('')
      setRemarkError(false)
    }
  }, [open, batch, configItems])

  const allSelected = configItems.length > 0 && configItems.every((i) => selectedKeys.has(i.key))
  const selectedCount = configItems.filter((i) => selectedKeys.has(i.key)).length
  const someSelected = selectedCount > 0 && !allSelected
  const selectedItems = configItems.filter((i) => selectedKeys.has(i.key))
  const selectedTotal = selectedItems.reduce((s, i) => s + i.totalEntries, 0)

  const toggleAll = () => {
    if (allSelected) setSelectedKeys(new Set())
    else setSelectedKeys(new Set(configItems.map((i) => i.key)))
  }

  const toggleOne = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleOk = () => {
    if (!selectedItems.length) return
    if (action === 'reject' && !remark.trim()) {
      setRemarkError(true)
      return
    }
    onConfirm({
      selectedKeys: [...selectedKeys],
      action,
      remark: remark.trim(),
    })
  }

  if (!batch) return null

  return (
    <Modal
      open={open}
      title="批次整体验收处理"
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
      width={720}
      fitViewport
      viewportMaxHeight="90vh"
      bodyClassName="space-y-4"
    >
      <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
        <div className="text-sm font-semibold text-gray-800">{batch.name}</div>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          下方为创建批次时勾选的任务，可选择其中部分或全部进行整体验收。
          {batch.filters ? `（${formatSamplingFiltersSummary(batch.filters)}）` : batch.basis ? `（${batch.basis}）` : ''}
        </p>
      </div>

      <div>
        <CheckboxListShell className="max-h-52">
          {configItems.length > 0 && (
            <CheckboxListSelectAllRow
              checked={allSelected}
              indeterminate={someSelected}
              onToggle={toggleAll}
              selectedCount={selectedCount}
              totalCount={configItems.length}
            />
          )}
          {configItems.map((item) => {
            const checked = selectedKeys.has(item.key)
            const sampled = calcSampledCount(item.totalEntries, item.ratio)
            return (
              <label
                key={item.key}
                className={`flex cursor-pointer items-center justify-between gap-3 border-b border-gray-50 px-3 py-3 last:border-0 hover:bg-gray-50 ${
                  checked ? 'bg-blue-50/30' : ''
                }`}
              >
                <span className="flex min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(item.key)}
                    className={`mt-0.5 ${CHECKBOX_LIST_CLS}`}
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-gray-400">
                      抽检比例 {item.ratio}% · 抽检条目 {sampled} 条
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-sm text-gray-500">{item.totalEntries} 条</span>
              </label>
            )
          })}
        </CheckboxListShell>
        {selectedCount > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            已选选项合计 {selectedTotal} 条条目
          </p>
        )}
      </div>

      <div>
        <label className={LBL}>处理操作</label>
        <div className="flex flex-wrap gap-2">
          <ActionRadio value="pass" active={action === 'pass'} onChange={setAction} label="批量通过" />
          <ActionRadio value="reject" active={action === 'reject'} onChange={setAction} label="批量驳回" />
        </div>
        <p className={`mt-2 ${HINT}`}>
          将按本批次创建时勾选的选项，对对应范围内的全部采集条目进行整体验收。
        </p>
      </div>

      <div>
        <label className={LBL}>备注</label>
        <textarea
          rows={3}
          maxLength={REMARK_MAX}
          value={remark}
          onChange={(e) => { setRemark(e.target.value); setRemarkError(false) }}
          placeholder="请输入处理备注（批量驳回时建议必填）"
          className={`${TEXTAREA_CLS} ${remarkError ? 'border-red-400 ring-1 ring-red-100' : ''}`}
        />
        <p className="mt-0.5 text-right text-xs text-gray-400">{remark.length}/{REMARK_MAX}</p>
        {remarkError && <p className="mt-1 text-xs text-red-500">批量驳回时请填写备注</p>}
      </div>
    </Modal>
  )
}
