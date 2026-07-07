import { useState } from 'react'
import Tabs from '../../components/common/Tabs'
import AllDataTab from './tabs/AllDataTab'
import RealDataTab from './tabs/RealDataTab'
import OpenDataTab from './tabs/OpenDataTab'

const tabs = [
  { key: 'all', label: '全部数据' },
  { key: 'real', label: '真机数据' },
  { key: 'open', label: '开源数据' },
]

export default function Dashboard() {
  const [tab, setTab] = useState('all')

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white px-5 pt-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">运营看板</h2>
        <Tabs items={tabs} activeKey={tab} onChange={setTab} />
      </div>

      {tab === 'all' && <AllDataTab />}
      {tab === 'real' && <RealDataTab />}
      {tab === 'open' && <OpenDataTab />}
    </div>
  )
}
