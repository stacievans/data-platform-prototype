import { useEffect, useState } from 'react'
import Drawer from '../common/Drawer'
import { FRAGMENT_ANNOT_DRAWER_WIDTH } from './CollectPlanForm'
import FragmentAnnotPreconfigPanel from './FragmentAnnotPreconfigPanel'
import { ensureMandatoryFragmentTypes, resolveFragmentTypesFromPlan } from './fragmentAnnotPreconfig'
import { updatePlanInStore } from '../../mock/plans'
import { nowDatetime } from '../../mock/tasks'

function cloneFragmentTypes(types) {
  return JSON.parse(JSON.stringify(types))
}

export default function FragmentAnnotConfigDrawer({ open, plan, onClose, onSaved }) {
  const [types, setTypes] = useState([])

  useEffect(() => {
    if (!plan) return
    setTypes(cloneFragmentTypes(resolveFragmentTypesFromPlan(plan)))
  }, [plan])

  const handleSave = () => {
    if (!plan) return
    updatePlanInStore(plan.id, {
      fragmentAnnotTypes: cloneFragmentTypes(ensureMandatoryFragmentTypes(types)),
      updatedAt: nowDatetime(),
    })
    onSaved?.()
    onClose()
  }

  return (
    <Drawer
      open={open}
      title="片段标注配置"
      onCancel={onClose}
      onOk={handleSave}
      okText="确定"
      width={FRAGMENT_ANNOT_DRAWER_WIDTH}
    >
      {plan && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            方案：
            <span className="font-medium text-gray-800">{plan.id} · {plan.name}</span>
          </p>
          <FragmentAnnotPreconfigPanel
            embedded
            types={types}
            autoFromPlan={false}
            onChange={setTypes}
          />
        </div>
      )}
    </Drawer>
  )
}
