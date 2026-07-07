import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Breadcrumb from './Breadcrumb'
import PermissionGuard from './PermissionGuard'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-full">
      <Header collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Sidebar collapsed={collapsed} />
      <main
        className={`min-h-screen bg-[#f0f2f5] pt-14 transition-all duration-200 ${
          collapsed ? 'pl-16' : 'pl-52'
        }`}
      >
        <div className="px-6 pb-10 pt-4">
          <div className="mb-4">
            <Breadcrumb />
          </div>
          <PermissionGuard />
        </div>
      </main>
    </div>
  )
}
