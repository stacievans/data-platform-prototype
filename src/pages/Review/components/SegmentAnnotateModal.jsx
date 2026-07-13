import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import { getAtomicSkillTags } from '../../../mock/tags'

const INPUT_CLS = 'h-8 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const LBL = 'mb-1 block text-xs text-gray-500'

export default function SegmentAnnotateModal({
  open,
  type,
  initial,
  onCancel,
  onConfirm,
}) {
  const isAction = type === 'action'
  const [startFrame, setStartFrame] = useState(0)
  const [endFrame, setEndFrame] = useState(0)
  const [desc, setDesc] = useState('')
  const [skill, setSkill] = useState('')
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!open) return
    setStartFrame(initial?.startFrame ?? 0)
    setEndFrame(initial?.endFrame ?? 0)
    setDesc(initial?.desc ?? '')
    setSkill(initial?.skill ?? '')
    setLabel(initial?.label ?? '')
  }, [open, initial])

  const skills = getAtomicSkillTags()

  const handleOk = () => {
    if (isAction) {
      onConfirm({
        startFrame: Number(startFrame) || 0,
        endFrame: Number(endFrame) || 0,
        skill: skill || 'move',
        desc: desc.trim(),
        tone: skill === 'move' ? 'gray' : 'blue',
      })
    } else {
      onConfirm({
        startFrame: Number(startFrame) || 0,
        endFrame: Number(endFrame) || 0,
        label: label.trim() || '区域',
      })
    }
  }

  return (
    <Modal
      open={open}
      title="标注"
      onCancel={onCancel}
      onOk={handleOk}
      okText="确认"
      width={480}
    >
      <div className="space-y-4">
        <div>
          <span className={LBL}>标注类型</span>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {isAction ? '动作语义' : '区域帧'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LBL}>起始帧</label>
            <input type="number" min={0} value={startFrame} onChange={(e) => setStartFrame(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LBL}>结束帧</label>
            <input type="number" min={0} value={endFrame} onChange={(e) => setEndFrame(e.target.value)} className={INPUT_CLS} />
          </div>
        </div>
        {isAction ? (
          <>
            <div>
              <label className={LBL}>步骤描述</label>
              <textarea
                rows={3}
                maxLength={100}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="请输入步骤描述"
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{desc.length} / 100</p>
            </div>
            <div>
              <label className={LBL}>技能标签</label>
              <select value={skill} onChange={(e) => setSkill(e.target.value)} className={`${INPUT_CLS} cursor-pointer`}>
                <option value="">请选择技能标签</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label className={LBL}>区域名称</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="请输入区域名称"
              className={INPUT_CLS}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
