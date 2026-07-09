import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  IconDashboard,
  IconCollection,
  IconDataset,
  IconTag,
  IconDevice,
  IconSystem,
  IconChevron,
} from '../common/Icons'
import { MENU_VIEW_PERMISSION } from '../../mock/permissions'
import { useAuth } from '../../context/AuthContext'

const menu = [
  { key: '/dashboard', label: '运营看板', icon: <IconDashboard />, permission: 'dashboard.view' },
  {
    key: 'collection',
    label: '数据采集',
    icon: <IconCollection />,
    children: [
      { key: '/collection/project', label: '采集项目', permission: 'collection.project.view' },
      { key: '/collection/task', label: '采集任务', permission: 'collection.task.view' },
      { key: '/collection/upload', label: '采集条目', permission: 'collection.upload.view' },
    ],
  },
  {
    key: 'dataset',
    label: '数据集管理',
    icon: <IconDataset />,
    children: [
      { key: '/dataset/self', label: '真机数据集', permission: 'dataset.self.view' },
    ],
  },
  { key: '/tag', label: '标签管理', icon: <IconTag />, permission: 'tag.view' },
  { key: '/device', label: '设备管理', icon: <IconDevice />, permission: 'device.view' },
  {
    key: 'system',
    label: '系统管理',
    icon: <IconSystem />,
    children: [
      { key: '/system/user', label: '用户管理', permission: 'system.user.view' },
      { key: '/system/role', label: '角色管理', permission: 'system.role.view' },
    ],
  },
]

export default function Sidebar({ collapsed }) {
  const location = useLocation()
  const { can } = useAuth()
  const [openKeys, setOpenKeys] = useState(['collection', 'dataset', 'system'])

  const visibleMenu = useMemo(() => {
    const canView = (item) => {
      const perm = item.permission ?? MENU_VIEW_PERMISSION[item.key]
      if (perm && can(perm)) return true
      if (item.altPermission && can(item.altPermission)) return true
      return !perm && !item.altPermission
    }
    return menu
      .map((item) => {
        if (item.children) {
          const children = item.children.filter((c) => canView(c))
          if (!children.length) return null
          return { ...item, children }
        }
        if (!canView(item)) return null
        return item
      })
      .filter(Boolean)
  }, [can])

  const toggle = (key) =>
    setOpenKeys((keys) =>
      keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key],
    )

  const itemBase =
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors cursor-pointer'

  return (
    <aside
      className={`fixed bottom-0 left-0 top-14 z-20 overflow-y-auto bg-slate-900 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-52'
      }`}
    >
      <nav className="space-y-1 p-2.5">
        {visibleMenu.map((item) => {
          if (!item.children) {
            return (
              <NavLink
                key={item.key}
                to={item.key}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `${itemBase} ${collapsed ? 'justify-center' : ''} ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          }

          const childActive = item.children.some((c) =>
            location.pathname.startsWith(c.key),
          )
          const open = openKeys.includes(item.key) && !collapsed

          return (
            <div key={item.key}>
              <button
                onClick={() => !collapsed && toggle(item.key)}
                title={collapsed ? item.label : undefined}
                className={`${itemBase} w-full ${collapsed ? 'justify-center' : 'justify-between'} ${
                  childActive && collapsed
                    ? 'bg-blue-600 text-white'
                    : childActive
                      ? 'text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </span>
                {!collapsed && <IconChevron open={open} />}
              </button>
              {open && (
                <div className="mt-0.5 space-y-0.5">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.key}
                      to={child.key}
                      className={({ isActive }) =>
                        `block rounded-md py-2 pl-11 pr-3 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
