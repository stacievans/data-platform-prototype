import { useState } from 'react'
import Tabs from '../../components/common/Tabs'
import TypeList from './TypeList'
import InstanceList from './InstanceList'

const TABS = [
  { key: 'instance', label: '设备实例' },
  { key: 'type', label: '设备类型' },
]

export default function DeviceManage() {
  const [tab, setTab] = useState('instance')

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 pt-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">设备管理</h2>
        <Tabs items={TABS} activeKey={tab} onChange={setTab} />
      </div>

      {tab === 'instance' && <InstanceList />}
      {tab === 'type' && <TypeList />}
    </div>
  )
}
