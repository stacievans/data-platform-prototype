import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { formatSamplingFiltersSummary, summarizeDetailItems } from '../../utils/samplingHelpers'

function passRateTone(rate) {
  if (rate >= 90) return 'text-emerald-600'
  if (rate >= 70) return 'text-amber-600'
  return 'text-red-500'
}

export default function SamplingBatchDetailModal({ open, batch, onClose }) {
  if (!open || !batch) return null

  const items = batch.detailItems ?? []
  const summary = summarizeDetailItems(items)

  return (
    <Modal
      open={open}
      title={`批次详情 · ${batch.name}`}
      onCancel={onClose}
      footer={<div className="flex justify-end"><Button onClick={onClose}>关闭</Button></div>}
      width={720}
      fitViewport
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>批次ID：<span className="font-medium text-gray-700">{batch.id}</span></span>
          <span>筛选条件：<span className="font-medium text-gray-700">{batch.filters ? formatSamplingFiltersSummary(batch.filters) : (batch.basis ?? '—')}</span></span>
          <span>创建人：<span className="font-medium text-gray-700">{batch.creator}</span></span>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-800">抽检明细</h4>
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">选项</th>
                  <th className="px-3 py-2 font-medium text-center">总条目</th>
                  <th className="px-3 py-2 font-medium text-center">比例</th>
                  <th className="px-3 py-2 font-medium text-center">抽检条目</th>
                  <th className="px-3 py-2 font-medium text-center">通过率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-gray-400">暂无抽检明细</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.label}>
                      <td className="px-3 py-2.5 text-gray-700">{item.label}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{item.totalEntries}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{item.ratio}%</td>
                      <td className="px-3 py-2.5 text-center text-gray-700">{item.sampledEntries}</td>
                      <td className={`px-3 py-2.5 text-center font-medium ${passRateTone(item.passRate ?? 0)}`}>
                        {item.passRate != null ? `${item.passRate}%` : '—'}
                      </td>
                    </tr>
                  ))
                )}
                {items.length > 0 && (
                  <tr className="bg-gray-50/80 font-medium">
                    <td className="px-3 py-2.5 text-gray-700">合计</td>
                    <td className="px-3 py-2.5 text-center text-gray-700">{summary.totalEntries}</td>
                    <td className="px-3 py-2.5 text-center text-gray-400">—</td>
                    <td className="px-3 py-2.5 text-center text-gray-700">{summary.sampledEntries}</td>
                    <td className={`px-3 py-2.5 text-center ${passRateTone(summary.passRate)}`}>
                      {summary.passRate}%
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  )
}
