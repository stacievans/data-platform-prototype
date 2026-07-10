import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import { PermButton, PermAction } from '../../components/common/PermissionAction'
import Modal from '../../components/common/Modal'
import { useCurrentNickname, useAuth } from '../../context/AuthContext'
import { IconPlus } from '../../components/common/Icons'
import {
  getAllDeviceTypes,
  isDeviceTypeNameTaken,
  setDeviceTypes,
  countInstancesByTypeId,
} from '../../mock/devices'
import {
  getBodyTypeTagNames,
  getEndTypeTagNames,
} from '../../mock/tags'
import { buildTypeNameReference } from '../../utils/deviceTypeName'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'
import urdfImg from '../../assets/review/urdf-robot.png'

const inputCls = 'h-8 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const readOnlyCls = 'h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none'
const selectCls = `${inputCls} bg-white`
const FILTER_CLS = 'h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'
const nowDatetime = () => nowDateTime()

const emptyTypeForm = () => {
  const bodies = getBodyTypeTagNames()
  const ends = getEndTypeTagNames()
  return {
    name: '',
    body: bodies[0] ?? '',
    leftEnd: ends[0] ?? '',
    rightEnd: ends[0] ?? '',
    description: '',
  }
}

function Field({ label, required, error, errorMsg, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error === 'required' && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
      {error === 'duplicate' && <p className="mt-1 text-xs text-red-500">{errorMsg ?? '类型名称已存在，请使用其他名称'}</p>}
    </div>
  )
}

function TypeModal({ open, editing, onCancel, onOk }) {
  const isEdit = Boolean(editing)
  const creatorName = useCurrentNickname()
  const bodyOptions = getBodyTypeTagNames()
  const endOptions = getEndTypeTagNames()
  const [form, setForm] = useState(emptyTypeForm())
  const [errs, setErrs] = useState({})

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name ?? '',
        body: editing.body,
        leftEnd: editing.leftEnd,
        rightEnd: editing.rightEnd,
        description: editing.description ?? '',
      })
    } else {
      setForm(emptyTypeForm())
    }
    setErrs({})
  }, [open, editing])

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrs((e) => ({ ...e, [k]: false }))
  }

  const handleOk = () => {
    const trimmedName = form.name.trim()
    const nextErrs = {}

    if (!trimmedName) nextErrs.name = 'required'
    else if (isDeviceTypeNameTaken(trimmedName, editing?.id)) nextErrs.name = 'duplicate'

    if (!isEdit) {
      if (!form.body) nextErrs.body = 'required'
      if (!form.leftEnd) nextErrs.leftEnd = 'required'
      if (!form.rightEnd) nextErrs.rightEnd = 'required'
    }

    if (Object.keys(nextErrs).length) { setErrs(nextErrs); return }

    const ts = nowDatetime()

    if (isEdit) {
      onOk({
        ...editing,
        name: trimmedName,
        description: form.description.trim(),
        updatedAt: ts,
      })
    } else {
      onOk({
        id: `DTY-${Date.now()}`,
        name: trimmedName,
        body: form.body,
        leftEnd: form.leftEnd,
        rightEnd: form.rightEnd,
        hasUrdf: false,
        description: form.description.trim(),
        creator: creatorName,
        createdAt: ts,
        updatedAt: ts,
      })
    }
  }

  const referencePreview = buildTypeNameReference(form.body, form.leftEnd, form.rightEnd)

  const renderBodyField = () => {
    if (isEdit) {
      return <input readOnly value={form.body} className={readOnlyCls} />
    }
    return (
      <select value={form.body} onChange={(e) => set('body', e.target.value)} className={selectCls}>
        {bodyOptions.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
    )
  }

  const renderEndField = (side, value, key) => {
    if (isEdit) {
      return <input readOnly value={value} className={readOnlyCls} />
    }
    return (
      <select value={value} onChange={(e) => set(key, e.target.value)} className={selectCls}>
        {endOptions.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
    )
  }

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑设备类型' : '新建设备类型'}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? '确定' : '创建'}
      width={520}
    >
      <div className="space-y-4">
        <Field label="类型名称" required error={errs.name}>
          <input
            placeholder="请输入类型名称"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputCls + (errs.name ? ' border-red-400 focus:ring-red-100' : '')}
          />
          <p className="mt-1 text-xs text-gray-400">参考：{referencePreview}</p>
        </Field>
        <Field label="本体" required={!isEdit} error={errs.body}>
          {renderBodyField()}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="左末端类型" required={!isEdit} error={errs.leftEnd}>
            {renderEndField('左', form.leftEnd, 'leftEnd')}
          </Field>
          <Field label="右末端类型" required={!isEdit} error={errs.rightEnd}>
            {renderEndField('右', form.rightEnd, 'rightEnd')}
          </Field>
        </div>
        <Field label="描述">
          <textarea
            rows={2}
            placeholder="请输入描述（选填）"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </Field>
      </div>
    </Modal>
  )
}

function DeleteTypeAction({ row, onDelete }) {
  const { can } = useAuth()
  const allowed = can('device.delete')
  const count = row.instanceCount ?? 0
  const blocked = count > 0
  const tip = `该类型下仍有 ${count} 个实例，请先变更实例类型或删除实例`
  const anchorRef = useRef(null)
  const tipRef = useRef(null)
  const [tipVisible, setTipVisible] = useState(false)
  const [tipStyle, setTipStyle] = useState({ left: 0, top: 0, opacity: 0 })

  const repositionTip = () => {
    const anchor = anchorRef.current
    const tipEl = tipRef.current
    if (!anchor || !tipEl) return

    const rect = anchor.getBoundingClientRect()
    const tipW = tipEl.offsetWidth
    const tipH = tipEl.offsetHeight
    const gap = 6
    const pad = 8
    const vw = window.innerWidth

    let left = rect.right - tipW
    if (left + tipW > vw - pad) left = vw - pad - tipW
    if (left < pad) left = pad

    let top = rect.top - gap - tipH
    if (top < pad) top = rect.bottom + gap

    setTipStyle({ left, top, opacity: 1 })
  }

  useLayoutEffect(() => {
    if (!tipVisible) return
    repositionTip()
    const onMove = () => repositionTip()
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [tipVisible, tip])

  const showTip = () => {
    setTipStyle({ left: 0, top: 0, opacity: 0 })
    setTipVisible(true)
  }

  if (!allowed) {
    return (
      <PermAction permission="device.delete" mode="disable" className="text-sm text-red-500">
        删除
      </PermAction>
    )
  }

  if (blocked) {
    return (
      <>
        <span
          ref={anchorRef}
          className="inline-flex"
          onMouseEnter={showTip}
          onMouseLeave={() => setTipVisible(false)}
        >
          <button
            type="button"
            disabled
            className="cursor-not-allowed text-sm text-red-500 opacity-40"
          >
            删除
          </button>
        </span>
        {tipVisible && createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            className="pointer-events-none fixed z-[9999] w-max max-w-[calc(100vw-16px)] whitespace-normal rounded bg-gray-800 px-2.5 py-1.5 text-left text-xs leading-relaxed text-white shadow-lg"
            style={{ left: tipStyle.left, top: tipStyle.top, opacity: tipStyle.opacity }}
          >
            {tip}
          </div>,
          document.body,
        )}
      </>
    )
  }

  return (
    <button
      type="button"
      className="cursor-pointer text-sm text-red-500 hover:text-red-400"
      onClick={() => onDelete(row)}
    >
      删除
    </button>
  )
}

function UrdfPreviewModal({ open, typeName, onClose }) {
  return (
    <Modal
      open={open}
      title="URDF 模型预览"
      onCancel={onClose}
      width={560}
      footer={(
        <div className="flex justify-end">
          <Button onClick={onClose}>关闭</Button>
        </div>
      )}
    >
      <p className="mb-4 text-sm text-gray-500">{typeName}</p>
      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-black">
        <img
          src={urdfImg}
          alt=""
          className="mx-auto aspect-[4/3] w-full max-h-[360px] object-contain"
          draggable={false}
        />
        <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
          零坐标初始姿态
        </span>
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">
        当前为静态占位，正式版本支持拖拽旋转查看
      </p>
    </Modal>
  )
}

export default function TypeList() {
  const [types, setTypes] = useState(() => getAllDeviceTypes())
  const bodyOptions = getBodyTypeTagNames()
  const endOptions = getEndTypeTagNames()
  const [bodyFilter, setBodyFilter] = useState('全部')
  const [nameQuery, setNameQuery] = useState('')
  const [leftEndFilter, setLeftEndFilter] = useState('全部')
  const [rightEndFilter, setRightEndFilter] = useState('全部')
  const [applied, setApplied] = useState({
    body: '全部', name: '', leftEnd: '全部', rightEnd: '全部',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewTarget, setPreviewTarget] = useState(null)

  const refresh = () => setTypes(getAllDeviceTypes())

  const filtered = useMemo(() => {
    return types.filter((t) => {
      if (applied.body !== '全部' && t.body !== applied.body) return false
      if (applied.name && !t.name.includes(applied.name)) return false
      if (applied.leftEnd !== '全部' && t.leftEnd !== applied.leftEnd) return false
      if (applied.rightEnd !== '全部' && t.rightEnd !== applied.rightEnd) return false
      return true
    })
  }, [types, applied])

  const resetFilters = () => {
    setBodyFilter('全部')
    setNameQuery('')
    setLeftEndFilter('全部')
    setRightEndFilter('全部')
    setApplied({ body: '全部', name: '', leftEnd: '全部', rightEnd: '全部' })
  }

  const applyFilters = () => {
    setApplied({
      body: bodyFilter,
      name: nameQuery.trim(),
      leftEnd: leftEndFilter,
      rightEnd: rightEndFilter,
    })
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingRow(null)
  }

  const handleSave = (type) => {
    const { instanceCount, ...raw } = type
    if (editingRow) {
      setDeviceTypes((prev) => prev.map((t) => (t.id === raw.id ? raw : t)))
    } else {
      setDeviceTypes((prev) => [raw, ...prev])
    }
    refresh()
    closeModal()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const typeId = deleteTarget.id
    if (countInstancesByTypeId(typeId) > 0) return
    setDeviceTypes((prev) => prev.filter((t) => t.id !== typeId))
    setDeleteTarget(null)
    refresh()
  }

  const columns = [
    {
      title: '类型名称',
      dataIndex: 'name',
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    { title: '本体', dataIndex: 'body' },
    { title: '左末端类型', dataIndex: 'leftEnd' },
    { title: '右末端类型', dataIndex: 'rightEnd' },
    {
      title: 'URDF',
      key: 'urdf',
      render: (_, row) => (
        row.hasUrdf ? (
          <Button variant="link" size="sm" onClick={() => setPreviewTarget(row)}>预览</Button>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
    },
    { title: '实例数量', dataIndex: 'instanceCount' },
    {
      title: '描述',
      dataIndex: 'description',
      render: (v) => <span className="max-w-xs truncate block text-gray-500" title={v}>{v || '—'}</span>,
    },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <PermAction
            permission="device.edit"
            className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
            onClick={() => { setEditingRow(row); setModalOpen(true) }}
          >
            编辑
          </PermAction>
          <DeleteTypeAction row={row} onDelete={setDeleteTarget} />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>本体</label>
              <select
                value={bodyFilter}
                onChange={(e) => setBodyFilter(e.target.value)}
                className={`${FILTER_CLS} cursor-pointer`}
              >
                <option value="全部">全部</option>
                {bodyOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>类型名称</label>
              <input
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="输入类型名称搜索"
                className={FILTER_CLS}
              />
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>左末端类型</label>
              <select
                value={leftEndFilter}
                onChange={(e) => setLeftEndFilter(e.target.value)}
                className={`${FILTER_CLS} cursor-pointer`}
              >
                <option value="全部">全部</option>
                {endOptions.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1 basis-0">
              <label className={LBL}>右末端类型</label>
              <select
                value={rightEndFilter}
                onChange={(e) => setRightEndFilter(e.target.value)}
                className={`${FILTER_CLS} cursor-pointer`}
              >
                <option value="全部">全部</option>
                {endOptions.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={resetFilters}>重置</Button>
            <Button variant="primary" onClick={applyFilters}>查询</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">设备类型</h2>
        <PermButton permission="device.create" variant="primary" icon={<IconPlus />} onClick={() => { setEditingRow(null); setModalOpen(true) }}>
          新建类型
        </PermButton>
      </div>

      <Table columns={columns} dataSource={filtered} />

      <TypeModal open={modalOpen} editing={editingRow} onCancel={closeModal} onOk={handleSave} />

      <UrdfPreviewModal
        open={!!previewTarget}
        typeName={previewTarget?.name ?? ''}
        onClose={() => setPreviewTarget(null)}
      />

      <Modal
        open={!!deleteTarget}
        title="删除设备类型"
        onCancel={() => setDeleteTarget(null)}
        onOk={confirmDelete}
        okText="确定删除"
        cancelText="取消"
        width={480}
      >
        <p className="text-sm leading-relaxed text-gray-600">
          确定删除类型「<strong className="text-gray-800">{deleteTarget?.name}</strong>」？
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          仅移除该设备类型选项，不影响历史任务和条目中已记录的类型信息。
        </p>
      </Modal>
    </div>
  )
}
