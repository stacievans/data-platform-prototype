import { useEffect, useMemo, useRef, useState } from 'react'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter, ListPageToolbar } from '../../components/common/ListPageCard'
import Button from '../../components/common/Button'
import { PermButton, PermAction } from '../../components/common/PermissionAction'
import Drawer from '../../components/common/Drawer'
import Modal from '../../components/common/Modal'
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal'
import { useCurrentNickname } from '../../context/AuthContext'
import { IconPlus, IconUpload, IconClose } from '../../components/common/Icons'
import {
  getAllDeviceTypes,
  isDeviceTypeNameTaken,
  setDeviceTypes,
} from '../../mock/devices'
import { isDeviceTypeBoundToTask } from '../../mock/tasks'
import {
  getBodyTypeTagNames,
  getEndTypeTagNames,
} from '../../mock/tags'
import { buildTypeNameReference } from '../../utils/deviceTypeName'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import urdfImg from '../../assets/review/urdf-robot.png'

const inputCls = 'h-8 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const readOnlyCls = 'h-8 w-full cursor-default rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 outline-none'
const selectCls = `${inputCls} bg-white`
const FILTER_CLS = 'h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'
const DESC_MAX = 500
const nowDatetime = () => nowDateTime()
const DELETE_DISABLED_TIP = '该设备类型已绑定任务，无法删除'
const deleteEnabledCls = 'cursor-pointer text-sm text-red-500 hover:text-red-400'
const deleteDisabledCls = 'cursor-not-allowed text-sm text-gray-300 select-none'

const URDF_FILE_MAX_BYTES = 100 * 1024 * 1024
const URDF_ACCEPT = '.zip,application/zip'

function resolveUrdfStatus(row) {
  if (row.urdfStatus) return row.urdfStatus
  return row.hasUrdf ? 'success' : 'none'
}

function renderUrdfCell(row, onPreview) {
  const status = resolveUrdfStatus(row)
  if (status === 'success') {
    return (
      <Button variant="link" size="sm" onClick={() => onPreview(row)}>
        预览
      </Button>
    )
  }
  if (status === 'failed') {
    return <span className="text-sm text-red-500">解析失败</span>
  }
  return <span className="text-gray-400">-</span>
}

const emptyTypeForm = () => {
  const bodies = getBodyTypeTagNames()
  const ends = getEndTypeTagNames()
  return {
    name: '',
    body: bodies[0] ?? '',
    leftEnd: ends[0] ?? '',
    rightEnd: ends[0] ?? '',
    description: '',
    urdfFileName: '',
  }
}

function UrdfFileUpload({ fileName, error, onSelect, onClear }) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const acceptFile = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'zip') {
      onSelect('', '请上传 .zip 格式文件')
      return
    }
    if (file.size > URDF_FILE_MAX_BYTES) {
      onSelect('', '文件大小不能超过 100MB')
      return
    }
    onSelect(file.name, '')
  }

  const onFileChange = (e) => {
    acceptFile(e.target.files?.[0])
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  if (fileName) {
    return (
      <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${error ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex min-w-0 items-center gap-2">
          <IconUpload className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="truncate text-sm text-gray-800">{fileName}</span>
        </div>
        <button
          type="button"
          onClick={() => { onClear(); if (fileRef.current) fileRef.current.value = '' }}
          className="ml-2 flex shrink-0 cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-red-500"
        >
          <IconClose className="h-3.5 w-3.5" />
          移除
        </button>
        <input ref={fileRef} type="file" accept={URDF_ACCEPT} className="hidden" onChange={onFileChange} />
      </div>
    )
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
          error
            ? 'border-red-400 bg-red-50/30'
            : dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
        }`}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <IconUpload className="mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600">点击或拖拽文件到此区域上传</p>
        <p className="mt-1 text-xs text-gray-400">支持上传 .zip 文件，大小不超过 100MB</p>
        <input ref={fileRef} type="file" accept={URDF_ACCEPT} className="hidden" onChange={onFileChange} />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
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
  const [urdfError, setUrdfError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name ?? '',
        body: editing.body,
        leftEnd: editing.leftEnd,
        rightEnd: editing.rightEnd,
        description: editing.description ?? '',
        urdfFileName: editing.hasUrdf || editing.urdfStatus === 'success' ? '当前 URDF 文件' : '',
      })
    } else {
      setForm(emptyTypeForm())
    }
    setErrs({})
    setUrdfError('')
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
    if (urdfError) return

    const ts = nowDatetime()

    const hasUrdfFile = Boolean(form.urdfFileName)

    if (isEdit) {
      onOk({
        ...editing,
        name: trimmedName,
        description: form.description.trim(),
        hasUrdf: hasUrdfFile,
        urdfStatus: hasUrdfFile ? 'success' : 'none',
        updatedAt: ts,
      })
    } else {
      onOk({
        id: `DTY-${Date.now()}`,
        name: trimmedName,
        body: form.body,
        leftEnd: form.leftEnd,
        rightEnd: form.rightEnd,
        hasUrdf: hasUrdfFile,
        urdfStatus: hasUrdfFile ? 'success' : 'none',
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

  const formBody = (
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
      <Field label="本体机型" required error={errs.body}>
        {renderBodyField()}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="左末端类型" required error={errs.leftEnd}>
          {renderEndField('左', form.leftEnd, 'leftEnd')}
        </Field>
        <Field label="右末端类型" required error={errs.rightEnd}>
          {renderEndField('右', form.rightEnd, 'rightEnd')}
        </Field>
      </div>
      <Field label="描述">
        <textarea
          rows={3}
          placeholder="请输入描述（选填）"
          value={form.description}
          onChange={(e) => set('description', e.target.value.slice(0, DESC_MAX))}
          maxLength={DESC_MAX}
          className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {form.description.length}/{DESC_MAX}
        </p>
      </Field>
      <Field label="URDF">
        <UrdfFileUpload
          fileName={form.urdfFileName}
          error={urdfError}
          onSelect={(name, err) => {
            setForm((f) => ({ ...f, urdfFileName: name }))
            setUrdfError(err)
          }}
          onClear={() => {
            setForm((f) => ({ ...f, urdfFileName: '' }))
            setUrdfError('')
          }}
        />
      </Field>
    </div>
  )

  return (
    <Drawer
      open={open}
      title={isEdit ? '编辑设备类型' : '新建设备类型'}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
    >
      {formBody}
    </Drawer>
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
        当前为静态占位，正式支持鼠标左键-平移、滚轮-缩放、右键-旋转视角
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

  const pageResetKey = useMemo(() => `${JSON.stringify(applied)}:${filtered.length}`, [applied, filtered.length])

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
    if (isDeviceTypeBoundToTask(deleteTarget)) return
    const typeId = deleteTarget.id
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
    { title: '本体机型', dataIndex: 'body' },
    { title: '左末端类型', dataIndex: 'leftEnd' },
    { title: '右末端类型', dataIndex: 'rightEnd' },
    {
      title: 'URDF',
      key: 'urdf',
      render: (_, row) => renderUrdfCell(row, setPreviewTarget),
    },
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
      render: (_, row) => {
        const boundToTask = isDeviceTypeBoundToTask(row)
        return (
        <div className="flex items-center gap-2">
          <PermAction
            permission="device.edit"
            className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
            onClick={() => { setEditingRow(row); setModalOpen(true) }}
          >
            编辑
          </PermAction>
          {boundToTask ? (
            <span className={deleteDisabledCls} title={DELETE_DISABLED_TIP}>删除</span>
          ) : (
            <PermAction
              permission="device.delete"
              className={deleteEnabledCls}
              onClick={() => setDeleteTarget(row)}
            >
              删除
            </PermAction>
          )}
        </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-3">
      <ListPageCard>
      <ListPageFilter>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 items-end gap-3">
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
              <label className={LBL}>本体机型</label>
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
      </ListPageFilter>

      <ListPageToolbar>
        <h2 className="text-base font-semibold text-gray-800">设备类型列表</h2>
        <PermButton permission="device.create" variant="primary" icon={<IconPlus />} onClick={() => { setEditingRow(null); setModalOpen(true) }}>
          新建
        </PermButton>
      </ListPageToolbar>

      <Table embedded columns={columns} dataSource={filtered} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />
      </ListPageCard>

      <TypeModal open={modalOpen} editing={editingRow} onCancel={closeModal} onOk={handleSave} />

      <UrdfPreviewModal
        open={!!previewTarget}
        typeName={previewTarget?.name ?? ''}
        onClose={() => setPreviewTarget(null)}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
