import Modal from '../common/Modal'

export default function ReQcKeepTagsModal({ open, onCancel, onKeep, onClear }) {
  return (
    <Modal
      open={open}
      title="重新质检"
      onCancel={onCancel}
      footer={(
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onKeep}
            className="cursor-pointer rounded-md border border-transparent bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500"
          >
            是
          </button>
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
          >
            否
          </button>
        </div>
      )}
      width={480}
    >
      <p className="text-sm leading-relaxed text-gray-600">
        是否保留历史标注标签内容？
      </p>
    </Modal>
  )
}
