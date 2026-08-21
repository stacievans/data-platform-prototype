import Modal from '../common/Modal'
import { formatDateTime } from '../../utils/formatDateTime'

function formatOperatorDisplay(operator) {
  if (!operator) return '—'
  if (typeof operator === 'string') return operator
  const { nickname, id } = operator
  if (!nickname) return '—'
  return id ? `${nickname}(${id})` : nickname
}

export default function BatchOpDetailModal({ open, record, onClose }) {
  if (!open || !record) return null

  const { opStatus, round, operator, time, detail } = record

  return (
    <Modal open={open} title="操作记录" onCancel={onClose} footer={null} width={480}>
      <div className="grid grid-cols-[5rem_1fr] gap-y-3 gap-x-2 text-sm">
        <span className="text-gray-500">操作状态</span>
        <span className="text-gray-800">{opStatus ?? '—'}</span>
        <span className="text-gray-500">轮次</span>
        <span className="text-gray-800">第{round ?? 1}轮</span>
        <span className="text-gray-500">操作人</span>
        <span className="text-gray-800">{formatOperatorDisplay(operator)}</span>
        <span className="text-gray-500">时间</span>
        <span className="text-gray-800">{formatDateTime(time)}</span>
        <span className="text-gray-500">详情</span>
        <span className="text-gray-800">{detail ?? '—'}</span>
      </div>
    </Modal>
  )
}
