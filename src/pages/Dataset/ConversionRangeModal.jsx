import Modal from '../../components/common/Modal'

function RangeCard({ title, subtitle, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center rounded-lg border px-6 py-10 text-center transition ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
          : 'cursor-pointer border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:shadow-sm'
      }`}
    >
      <div className={`text-base font-medium ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>{title}</div>
      <div className={`mt-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</div>
    </button>
  )
}

export default function ConversionRangeModal({
  open,
  selectedCount,
  totalCount,
  onCancel,
  onSelect,
}) {
  const hasSelection = selectedCount > 0

  return (
    <Modal open={open} title="请选择转换范围" onCancel={onCancel} width={560} footer={null}>
      <div className="flex gap-4">
        <RangeCard
          title="已选择的条目"
          subtitle={hasSelection ? `已选择 ${selectedCount} 个文件` : '未选择任何文件'}
          disabled={!hasSelection}
          onClick={() => onSelect('selected')}
        />
        <RangeCard
          title="全部条目"
          subtitle={`共 ${totalCount} 个文件`}
          onClick={() => onSelect('all')}
        />
      </div>
    </Modal>
  )
}
