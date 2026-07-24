import { Link, useLocation } from 'react-router-dom'

const routes = [
  { match: /^\/dashboard/, crumbs: [['运营看板']] },
  {
    match: /^\/collection\/project\/.+/,
    crumbs: [['数据采集'], ['采集项目', '/collection/project'], ['项目详情']],
  },
  { match: /^\/collection\/project/, crumbs: [['数据采集'], ['采集项目']] },
  {
    match: /^\/collection\/task\/.+/,
    crumbs: [['数据采集'], ['采集任务', '/collection/task'], ['任务详情']],
  },
  { match: /^\/collection\/task/, crumbs: [['数据采集'], ['采集任务']] },
  { match: /^\/collection\/upload/, crumbs: [['数据采集'], ['采集条目']] },
  { match: /^\/dataset\/self\/download$/, crumbs: [['数据集管理'], ['真机数据集', '/dataset/self'], ['下载数据集']] },
  { match: /^\/dataset\/self\/.+/, crumbs: [['数据集管理'], ['真机数据集', '/dataset/self'], ['数据集详情']] },
  { match: /^\/dataset\/self/, crumbs: [['数据集管理'], ['真机数据集']] },
  { match: /^\/tag\/audit-template\/.+/, crumbs: [['标签管理'], ['审核模板', '/tag/audit'], ['模板详情']] },
  { match: /^\/tag\/collect/, crumbs: [['标签管理'], ['采集标签']] },
  { match: /^\/tag\/device/, crumbs: [['标签管理'], ['设备标签']] },
  { match: /^\/tag\/audit/, crumbs: [['标签管理'], ['审核模板']] },
  { match: /^\/tag/, crumbs: [['标签管理']] },
  { match: /^\/device/, crumbs: [['设备管理']] },
  { match: /^\/system\/user/, crumbs: [['系统管理'], ['用户管理']] },
  { match: /^\/system\/role/, crumbs: [['系统管理'], ['角色管理']] },
  { match: /^\/system\/org\/[^/]+$/, crumbs: [['系统管理'], ['组织管理', '/system/org'], ['组织详情']] },
  { match: /^\/system\/org/, crumbs: [['系统管理'], ['组织管理']] },
  { match: /^\/system/, crumbs: [['系统管理']] },
]

export default function Breadcrumb() {
  const { pathname } = useLocation()

  let crumbs = null
  const route = routes.find((r) => r.match.test(pathname))
  if (route) crumbs = route.crumbs

  if (!crumbs) return null

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Link to="/dashboard" className="text-gray-400 hover:text-blue-600">
        首页
      </Link>
      {crumbs.map(([label, link], i) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="text-gray-300">/</span>
          {link ? (
            <Link to={link} className="text-gray-400 hover:text-blue-600">
              {label}
            </Link>
          ) : (
            <span
              className={
                i === crumbs.length - 1 ? 'text-gray-700' : 'text-gray-400'
              }
            >
              {label}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
