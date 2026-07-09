import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import {
  CHECKBOX_LIST_CLS,
  CheckboxListSearchInput,
  CheckboxListSelectAllRow,
  CheckboxListShell,
} from '../../components/common/CheckboxList'
import {
  CREATE_BASIS_OPTIONS,
  buildSamplingOptions,
  calcSampledCount,
  summarizeConfigItems,
} from '../../utils/samplingHelpers'

const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const LBL = 'mb-1.5 block text-sm text-gray-700'
const HINT = 'text-xs text-gray-400'

function emptyForm() {
  return {
    name: '',
    basis: '任务名称',
    search: '',
    selected: {},
  }
}

export default function CreateSamplingBatchModal({ open, projectId, onCancel, onConfirm }) {
  const [form, setForm] = useState(emptyForm)
  const [nameError, setNameError] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setNameError(false)
    }
  }, [open, projectId])

  const options = useMemo(
    () => buildSamplingOptions(projectId, form.basis),
    [projectId, form.basis],
  )

  const filteredOptions = useMemo(() => {
    const q = form.search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, form.search])

  const selectedList = useMemo(
    () => Object.values(form.selected),
    [form.selected],
  )

  const summary = useMemo(() => summarizeConfigItems(selectedList), [selectedList])

  const allFilteredSelected = filteredOptions.length > 0
    && filteredOptions.every((o) => form.selected[o.key])
  const someFilteredSelected = filteredOptions.some((o) => form.selected[o.key])

  const setBasis = (basis) => {
    setForm({ name: form.name, basis, search: '', selected: {} })
  }

  const toggleOption = (opt) => {
    setForm((prev) => {
      const next = { ...prev.selected }
      if (next[opt.key]) delete next[opt.key]
      else next[opt.key] = { ...opt, ratio: 20 }
      return { ...prev, selected: next }
    })
  }

  const setRatio = (key, ratio) => {
    setForm((prev) => ({
      ...prev,
      selected: {
        ...prev.selected,
        [key]: { ...prev.selected[key], ratio },
      },
    }))
  }

  const toggleSelectAllFiltered = () => {
    setForm((prev) => {
      const next = { ...prev.selected }
      if (allFilteredSelected) {
        filteredOptions.forEach((o) => delete next[o.key])
      } else {
        filteredOptions.forEach((o) => {
          if (!next[o.key]) next[o.key] = { ...o, ratio: 20 }
        })
      }
      return { ...prev, selected: next }
    })
  }

  const handleOk = () => {
    if (!form.name.trim()) {
      setNameError(true)
      return
    }
    if (!selectedList.length) return
    onConfirm({
      name: form.name.trim(),
      basis: form.basis,
      configItems: selectedList.map((item) => ({
        key: item.key,
        label: item.label,
        totalEntries: item.totalEntries,
        ratio: Number(item.ratio) || 0,
      })),
    })
  }

  return (
    <Modal
      open={open}
      title="新建"
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
      width={760}
      fitViewport
      viewportMaxHeight="90vh"
      bodyClassName="space-y-5"
    >
      <div>
        <label className={LBL}>
          批次名称 <span className="text-red-500">*</span>
        </label>
        <input
          value={form.name}
          onChange={(e) => { setForm({ ...form, name: e.target.value }); setNameError(false) }}
          placeholder="请输入批次名称，例如：卧室整理·第二轮抽检"
          className={`${INPUT_CLS} ${nameError ? 'border-red-400 ring-1 ring-red-100' : ''}`}
        />
        {nameError && <p className="mt-1 text-xs text-red-500">请填写批次名称</p>}
      </div>

      <div>
        <label className={LBL}>抽样依据</label>
        <div className="flex flex-wrap gap-2">
          {CREATE_BASIS_OPTIONS.map((opt) => {
            const active = form.basis === opt
            return (
              <label
                key={opt}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="sampling-basis"
                  checked={active}
                  onChange={() => setBasis(opt)}
                  className="text-blue-600"
                />
                {opt}
              </label>
            )
          })}
        </div>
        <p className={`mt-2 ${HINT}`}>单选一类抽样依据；勾选下方选项并配置随机抽检比例。</p>
      </div>

      <div>
        <label className={LBL}>选择范围</label>
        <CheckboxListSearchInput
          value={form.search}
          onChange={(e) => setForm({ ...form, search: e.target.value })}
          placeholder="模糊查找选项"
          className="mb-2"
        />
        <CheckboxListShell
          className="max-h-44"
          empty={
            filteredOptions.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-400">暂无可选范围</p>
            ) : undefined
          }
        >
          {filteredOptions.length > 0 && (
            <>
              <CheckboxListSelectAllRow
                checked={allFilteredSelected}
                indeterminate={someFilteredSelected && !allFilteredSelected}
                onToggle={toggleSelectAllFiltered}
                selectedCount={filteredOptions.filter((o) => form.selected[o.key]).length}
                totalCount={filteredOptions.length}
              />
              {filteredOptions.map((opt) => {
                const checked = Boolean(form.selected[opt.key])
                return (
                  <label
                    key={opt.key}
                    className={`flex cursor-pointer items-center justify-between gap-3 border-b border-gray-50 px-3 py-2.5 last:border-0 hover:bg-gray-50 ${
                      checked ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOption(opt)}
                        className={CHECKBOX_LIST_CLS}
                      />
                      <span className="truncate text-sm text-gray-700">{opt.label}</span>
                    </span>
                    <span className="shrink-0 text-sm text-gray-400">{opt.totalEntries} 条</span>
                  </label>
                )
              })}
            </>
          )}
        </CheckboxListShell>
      </div>

      {selectedList.length > 0 && (
        <div>
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">选项</th>
                  <th className="px-3 py-2 font-medium text-center">总条目</th>
                  <th className="px-3 py-2 font-medium text-center">比例</th>
                  <th className="px-3 py-2 font-medium text-center">抽检条目</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedList.map((item) => {
                  const sampled = calcSampledCount(item.totalEntries, item.ratio)
                  return (
                    <tr key={item.key}>
                      <td className="px-3 py-2.5 text-gray-700">{item.label}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{item.totalEntries}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={item.ratio}
                            onChange={(e) => setRatio(item.key, e.target.value)}
                            className="h-8 w-16 rounded border border-gray-200 px-2 text-center text-sm outline-none focus:border-blue-400"
                          />
                          <span className="text-gray-400">%</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium text-gray-700">{sampled}</td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50/80">
                  <td colSpan={4} className="px-3 py-2.5 text-sm text-gray-600">
                    合计：{summary.optionCount} 个选项 · {summary.totalEntries} 条目 · {summary.sampledEntries} 条抽检条目
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}
