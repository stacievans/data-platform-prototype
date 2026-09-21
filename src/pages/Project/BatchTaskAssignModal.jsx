import { Fragment, useEffect, useMemo, useState } from 'react'
import Button from '../../components/common/Button'
import Drawer from '../../components/common/Drawer'
import { CHECKBOX_LIST_CLS, IndeterminateCheckbox } from '../../components/common/CheckboxList'
import { IconSearch } from '../../components/common/Icons'
import { updateBatchTaskAssignment } from '../../mock/batchTasks'
import { listOrgUsersByRole } from '../../utils/orgUsers'

const INPUT_CLS =
  'h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const LIMIT_TIP = '单个用户领题数量限制，达到限制后需完成进行中的题后才可领取新题'

const PROCESS_STEPS = [
  {
    key: 'review',
    label: '标注',
    pickerTitle: '分配标注人员',
    successToast: '标注员分配成功',
  },
  {
    key: 'accept',
    label: '验收',
    pickerTitle: '分配验收人员',
    successToast: '验收员分配成功',
  },
]

/** 左侧三列内容区 + 右侧与二级同宽的叠层区（二级盖住此区含底部按钮，不挡领题列） */
const SECONDARY_DRAWER_WIDTH = 'min(400px, 38vw)'
const PRIMARY_CONTENT_WIDTH = '25rem'
const PRIMARY_DRAWER_WIDTH = `min(calc(${PRIMARY_CONTENT_WIDTH} + ${SECONDARY_DRAWER_WIDTH}), 96vw)`
const ASSIGN_BTN_CLS =
  'inline-flex h-9 min-w-[72px] max-w-[88px] cursor-pointer items-center justify-center rounded border px-3 text-sm transition'
const LIMIT_INPUT_CLS = `${INPUT_CLS} h-9 w-[88px] max-w-[88px]`

function AssignButton({ assigned, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        assigned
          ? `${ASSIGN_BTN_CLS} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`
          : `${ASSIGN_BTN_CLS} border-gray-300 bg-white text-blue-600 hover:border-blue-400 hover:bg-blue-50`
      }
    >
      分配
    </button>
  )
}

function AssigneePickerDrawer({
  open,
  title,
  users,
  initialSelected,
  onClose,
  onConfirm,
}) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(() => new Set())

  useEffect(() => {
    if (!open) return
    setQ('')
    setSelected(new Set(initialSelected.map((u) => u.username)))
  }, [open, initialSelected, title])

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return users
    return users.filter((u) => u.username.toLowerCase().includes(kw))
  }, [users, q])

  const toggle = (username) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(username)) next.delete(username)
      else next.add(username)
      return next
    })
  }

  const toggleAllVisible = () => {
    const allOn = filtered.length > 0 && filtered.every((u) => selected.has(u.username))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOn) filtered.forEach((u) => next.delete(u.username))
      else filtered.forEach((u) => next.add(u.username))
      return next
    })
  }

  const allVisible = filtered.length > 0 && filtered.every((u) => selected.has(u.username))
  const someVisible = filtered.some((u) => selected.has(u.username))

  return (
    <Drawer
      open={open}
      title={title}
      width={SECONDARY_DRAWER_WIDTH}
      zIndex={61}
      mask={false}
      onCancel={onClose}
      footer={(
        <>
          <span className="mr-auto text-sm text-gray-500">已选用户 {selected.size} 人</span>
          <Button onClick={onClose}>取消</Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(users.filter((u) => selected.has(u.username)))}
          >
            确认
          </Button>
        </>
      )}
    >
      <div className="-mx-6 -my-5 flex min-h-[min(480px,65vh)] flex-col">
        <div className="flex shrink-0 justify-end px-6 py-3">
          <div className="relative w-1/2 min-w-[160px]">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="请输入用户名称"
              className={`${INPUT_CLS} w-full pl-8`}
            />
          </div>
        </div>
        <div className="mx-6 min-h-0 flex-1 overflow-hidden rounded-md border border-gray-200">
          <div className="grid grid-cols-[36px_1fr_1fr] items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
            <IndeterminateCheckbox
              checked={allVisible}
              indeterminate={someVisible && !allVisible}
              onChange={toggleAllVisible}
            />
            <span>用户名</span>
            <span>昵称</span>
          </div>
          <div className="max-h-[min(52vh,480px)] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-gray-400">无匹配用户</p>
            ) : (
              filtered.map((u) => (
                <label
                  key={u.username}
                  className="grid grid-cols-[36px_1fr_1fr] items-center gap-2 border-b border-gray-50 px-3 py-2.5 last:border-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(u.username)}
                    onChange={() => toggle(u.username)}
                    className={CHECKBOX_LIST_CLS}
                  />
                  <span className="truncate text-sm text-gray-800">{u.username}</span>
                  <span className="truncate text-sm text-gray-500">{u.nickname}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export default function BatchTaskAssignModal({
  open,
  batchTask,
  onClose,
  onSaved,
  showToast,
}) {
  const [reviewAssignees, setReviewAssignees] = useState([])
  const [acceptAssignees, setAcceptAssignees] = useState([])
  const [reviewLimit, setReviewLimit] = useState('')
  const [acceptLimit, setAcceptLimit] = useState('')
  const [picker, setPicker] = useState(null)

  const reviewerPool = useMemo(() => listOrgUsersByRole('标注员'), [])
  const acceptorPool = useMemo(() => listOrgUsersByRole('验收员'), [])

  useEffect(() => {
    if (!open || !batchTask) return
    setReviewAssignees(batchTask.reviewAssignees ?? [])
    setAcceptAssignees(batchTask.acceptAssignees ?? [])
    setReviewLimit(batchTask.reviewClaimLimit ?? '')
    setAcceptLimit(batchTask.acceptClaimLimit ?? '')
    setPicker(null)
  }, [open, batchTask])

  const parseLimit = (raw) => {
    if (raw === '' || raw == null) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 1 || n > 9999) return 'invalid'
    return n
  }

  const handleConfirm = () => {
    const rl = parseLimit(reviewLimit)
    const al = parseLimit(acceptLimit)
    if (rl === 'invalid' || al === 'invalid') {
      showToast?.('领题限制请输入 1~9999 之间的整数，或留空表示无限制')
      return
    }
    updateBatchTaskAssignment(batchTask.id, {
      reviewAssignees,
      acceptAssignees,
      reviewClaimLimit: rl,
      acceptClaimLimit: al,
    })
    showToast?.('分配结果已保存')
    onSaved?.()
    onClose?.()
  }

  const closeAll = () => {
    setPicker(null)
    onClose?.()
  }

  const stepState = {
    review: {
      assignees: reviewAssignees,
      setAssignees: setReviewAssignees,
      limit: reviewLimit,
      setLimit: setReviewLimit,
      users: reviewerPool,
    },
    accept: {
      assignees: acceptAssignees,
      setAssignees: setAcceptAssignees,
      limit: acceptLimit,
      setLimit: setAcceptLimit,
      users: acceptorPool,
    },
  }

  const activePicker = picker ? PROCESS_STEPS.find((s) => s.key === picker) : null
  const activeState = picker ? stepState[picker] : null

  return (
    <>
      <Drawer
        open={open}
        title={`分配 · ${batchTask?.name ?? ''}`}
        width={PRIMARY_DRAWER_WIDTH}
        zIndex={60}
        mask
        onCancel={closeAll}
        footer={(
          <>
            <Button onClick={closeAll}>取消</Button>
            <Button variant="primary" onClick={handleConfirm}>确定</Button>
          </>
        )}
      >
        <div className="inline-grid max-w-[25rem] grid-cols-[auto_auto_auto] items-center gap-x-4 gap-y-4">
          <span className="self-end border-b border-gray-100 pb-2 text-sm font-medium text-gray-700">工序</span>
          <span className="self-end border-b border-gray-100 pb-2 text-sm font-medium text-gray-700">分配人员</span>
          <span className="flex items-center gap-1 self-end border-b border-gray-100 pb-2 text-sm font-medium text-gray-700">
            领题限制
            <span className="cursor-help text-xs font-normal text-gray-400" title={LIMIT_TIP}>ⓘ</span>
          </span>

          {PROCESS_STEPS.map((step, index) => {
            const state = stepState[step.key]
            const isLast = index === PROCESS_STEPS.length - 1
            return (
              <Fragment key={step.key}>
                <div className="relative flex items-center">
                  {!isLast && (
                    <span
                      className="absolute left-[7px] top-[18px] h-[calc(100%+16px)] w-px border-l border-dashed border-gray-300"
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10 mr-2 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-blue-500 bg-white" />
                  <span className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-800">{step.label}</span>
                </div>
                <div>
                  <AssignButton
                    assigned={state.assignees.length > 0}
                    onClick={() => setPicker(step.key)}
                  />
                </div>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={state.limit}
                  onChange={(e) => state.setLimit(e.target.value)}
                  placeholder="无限制"
                  className={LIMIT_INPUT_CLS}
                />
              </Fragment>
            )
          })}
        </div>
      </Drawer>

      {activePicker && activeState && (
        <AssigneePickerDrawer
          open={open}
          title={activePicker.pickerTitle}
          users={activeState.users}
          initialSelected={activeState.assignees}
          onClose={() => setPicker(null)}
          onConfirm={(picked) => {
            activeState.setAssignees(picked)
            setPicker(null)
            showToast?.(activePicker.successToast)
          }}
        />
      )}
    </>
  )
}
