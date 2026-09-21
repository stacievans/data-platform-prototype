import { useRef, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { IconUpload, IconClose } from '../../components/common/Icons'
import {
  parsePreAnnotationPayload,
  runPreAnnotationImport,
  validatePreAnnotationFile,
} from '../../utils/preAnnotationImport'

export default function PreAnnotationImportModal({
  open,
  task,
  onClose,
  showToast,
  retryFailedOnly = false,
}) {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const resetFile = () => {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => {
    if (submitting) return
    resetFile()
    onClose?.()
  }

  const acceptFile = (nextFile) => {
    if (!nextFile) return
    const check = validatePreAnnotationFile(nextFile)
    if (!check.ok) {
      if (check.toast) showToast?.(check.toast)
      return
    }
    setFile(nextFile)
  }

  const handleConfirm = async () => {
    if (!task?.id || submitting) return
    const check = validatePreAnnotationFile(file)
    if (!check.ok) {
      if (check.toast) showToast?.(check.toast)
      return
    }

    setSubmitting(true)
    let items
    try {
      const text = await file.text()
      items = parsePreAnnotationPayload(text)
    } catch {
      showToast?.('JSON 格式不合法，请检查后重试')
      setSubmitting(false)
      return
    }

    showToast?.('预标注结果导入任务成功提交')
    resetFile()
    onClose?.()
    showToast?.('预标注导入开始')

    window.setTimeout(() => {
      const { success, fail } = runPreAnnotationImport(task.id, items, { retryFailedOnly })
      showToast?.(`预标注导入完成：成功${success}条，失败${fail}条`, { variant: 'success' })
      setSubmitting(false)
    }, 600)
  }

  return (
    <Modal
      open={open}
      title="预标注结果导入"
      onCancel={handleClose}
      width={560}
      footer={(
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">导入后将会覆盖标注结果，请谨慎操作</p>
          <div className="flex shrink-0 gap-2">
            <Button onClick={handleClose} disabled={submitting}>取消</Button>
            <Button variant="primary" onClick={handleConfirm} disabled={submitting || !file}>
              确定
            </Button>
          </div>
        </div>
      )}
    >
      <div className="text-left">
        <label className="mb-2 block text-left text-sm text-gray-700">
          <span className="text-red-500">*</span>
          {' '}
          预标注结果文件
        </label>
        {file ? (
          <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <IconUpload className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="truncate text-sm text-gray-800">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={resetFile}
              className="ml-2 flex shrink-0 cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-red-500"
            >
              <IconClose className="h-3.5 w-3.5" />
              移除
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click()
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              acceptFile(e.dataTransfer.files?.[0])
            }}
          >
            <IconUpload className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">点击或拖拽文件到此区域上传</p>
            <p className="mt-1 text-xs text-gray-400">支持 JSON 格式，文件大小不超过 10MB</p>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
