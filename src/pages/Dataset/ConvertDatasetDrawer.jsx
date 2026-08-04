import { useEffect, useMemo, useState } from 'react'
import Drawer from '../../components/common/Drawer'
import Button from '../../components/common/Button'
import { IconPlus } from '../../components/common/Icons'
import { getConvertedDatasetsByDatasetId } from '../../mock/datasetConversions'

const INPUT_CLS =
  'h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const INPUT_ERR_CLS =
  'h-9 w-full rounded-md border border-red-400 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'

const DEFAULT_CAMERAS = [
  'observations/camera/rgb/head',
  'observations/camera/rgb/left',
  'observations/camera/rgb/right',
]

function FormLabel({ children, required }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
      {required && <span className="text-red-500">*</span>}
      {children}
    </label>
  )
}

function FrameIntervalInput({ value, onChange, suffix }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-24 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {suffix ? <span className="text-sm text-gray-500">{suffix}</span> : null}
    </div>
  )
}

function RemoveIconButton({ onClick }) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-500"
      onClick={onClick}
      aria-label="删除"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </svg>
    </button>
  )
}

const emptyForm = () => ({
  frameInterval: '0',
  targetMode: 'new',
  datasetName: '',
  existingDatasetId: '',
  cameras: [...DEFAULT_CAMERAS],
})

export default function ConvertDatasetDrawer({
  open,
  taskType,
  datasetId,
  onCancel,
  onConfirm,
}) {
  const isImage = taskType === '转图片'
  const title = isImage ? '转换图片数据集' : '转换视频数据集'
  const convertedType = isImage ? '图片' : '视频'

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const existingOptions = useMemo(() => {
    if (!datasetId) return []
    return getConvertedDatasetsByDatasetId(datasetId).filter((d) => d.type === convertedType)
  }, [datasetId, convertedType, open])

  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setErrors({})
    }
  }, [open, taskType])

  const updateCamera = (index, value) => {
    setForm((f) => ({
      ...f,
      cameras: f.cameras.map((c, i) => (i === index ? value : c)),
    }))
  }

  const removeCamera = (index) => {
    setForm((f) => ({
      ...f,
      cameras: f.cameras.filter((_, i) => i !== index),
    }))
  }

  const addCamera = () => {
    setForm((f) => ({ ...f, cameras: [...f.cameras, ''] }))
  }

  const restoreDefaultCameras = () => {
    setForm((f) => ({ ...f, cameras: [...DEFAULT_CAMERAS] }))
    setErrors((e) => ({ ...e, cameras: false }))
  }

  const handleConfirm = () => {
    const nextErrors = {}
    if (form.targetMode === 'new') {
      if (!form.datasetName.trim()) nextErrors.datasetName = true
    } else if (!form.existingDatasetId) {
      nextErrors.existingDatasetId = true
    }

    const filledCameras = form.cameras.map((c) => c.trim()).filter(Boolean)
    if (!filledCameras.length) nextErrors.cameras = true

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    onConfirm({
      frameInterval: isImage ? Number(form.frameInterval) || 0 : undefined,
      targetMode: form.targetMode,
      datasetName: form.targetMode === 'new' ? form.datasetName.trim() : undefined,
      existingDatasetId: form.targetMode === 'existing' ? form.existingDatasetId : undefined,
      cameras: filledCameras,
    })
  }

  return (
    <Drawer open={open} title={title} onCancel={onCancel} onOk={handleConfirm}>
      <div className="space-y-5">
        {isImage && (
          <div>
            <FormLabel>抽帧间隔</FormLabel>
            <FrameIntervalInput
              value={form.frameInterval}
              onChange={(v) => setForm((f) => ({ ...f, frameInterval: v }))}
              suffix="帧"
            />
          </div>
        )}

        <div>
          <FormLabel required>目标数据集名称</FormLabel>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="targetMode"
                checked={form.targetMode === 'new'}
                onChange={() => {
                  setForm((f) => ({ ...f, targetMode: 'new', existingDatasetId: '' }))
                  setErrors((e) => ({ ...e, existingDatasetId: false }))
                }}
                className="text-blue-600"
              />
              新建数据集
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="targetMode"
                checked={form.targetMode === 'existing'}
                onChange={() => {
                  setForm((f) => ({ ...f, targetMode: 'existing', datasetName: '' }))
                  setErrors((e) => ({ ...e, datasetName: false }))
                }}
                className="text-blue-600"
              />
              已有数据集
            </label>
          </div>
        </div>

        {form.targetMode === 'new' ? (
          <div>
            <FormLabel required>数据集名称</FormLabel>
            <input
              value={form.datasetName}
              onChange={(e) => {
                setForm((f) => ({ ...f, datasetName: e.target.value }))
                setErrors((e) => ({ ...e, datasetName: false }))
              }}
              placeholder="请输入数据集名称"
              className={errors.datasetName ? INPUT_ERR_CLS : INPUT_CLS}
            />
            {errors.datasetName && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
          </div>
        ) : (
          <div>
            <FormLabel required>选择数据集</FormLabel>
            <select
              value={form.existingDatasetId}
              onChange={(e) => {
                setForm((f) => ({ ...f, existingDatasetId: e.target.value }))
                setErrors((er) => ({ ...er, existingDatasetId: false }))
              }}
              className={`${errors.existingDatasetId ? INPUT_ERR_CLS : INPUT_CLS} cursor-pointer`}
            >
              <option value="">请选择已有数据集</option>
              {existingOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.existingDatasetId && <p className="mt-1 text-xs text-red-500">请填写此项</p>}
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <FormLabel>相机选择</FormLabel>
            <button
              type="button"
              className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
              onClick={restoreDefaultCameras}
            >
              恢复默认
            </button>
          </div>
          <div className="space-y-2">
            {form.cameras.map((camera, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={camera}
                  onChange={(e) => updateCamera(index, e.target.value)}
                  placeholder="请输入相机对应的位置"
                  className={
                    errors.cameras && !camera.trim()
                      ? INPUT_ERR_CLS
                      : INPUT_CLS
                  }
                />
                <RemoveIconButton onClick={() => removeCamera(index)} />
              </div>
            ))}
          </div>
          <Button
            className="mt-3 w-full border-dashed"
            icon={<IconPlus />}
            onClick={addCamera}
          >
            添加相机
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
