import { Link, useLocation } from 'react-router-dom'
import { getTaskById } from '../../mock/tasks'

const routes = [
  { match: /^\/intro/, crumbs: [['数采介绍']] },
  { match: /^\/dashboard/, crumbs: [['运营看板']] },
  { match: /^\/backflow\/events/, crumbs: [['真机回流'], ['事件中心']] },
  { match: /^\/backflow\/triggers/, crumbs: [['真机回流'], ['触发器配置']] },
  { match: /^\/backflow\/devices/, crumbs: [['真机回流'], ['回流设备']] },
  { match: /^\/backflow/, crumbs: [['真机回流'], ['回流看板']] },
  {
    match: /^\/collection\/project\/.+/,
    crumbs: [['采集项目', '/collection/project'], ['项目详情']],
  },
  { match: /^\/collection\/project/, crumbs: [['采集项目']] },
  {
    match: /^\/collection\/task\/.+/,
    crumbs: [['采集项目', '/collection/project'], ['项目详情'], ['任务详情']],
  },
  { match: /^\/dataset\/self\/download$/, crumbs: [['数据集管理'], ['真机数据集', '/dataset/self'], ['下载数据集']] },
  { match: /^\/dataset\/self\/[^/]+\/converted\/.+/, crumbs: [['数据集管理'], ['真机数据集', '/dataset/self'], ['数据集详情'], ['转换数据集详情']] },
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

  const route = routes.find((r) => r.match.test(pathname))
  let crumbs = route?.crumbs

  const taskMatch = pathname.match(/^\/collection\/task\/([^/]+)/)
  if (taskMatch && crumbs) {
    const task = getTaskById(taskMatch[1])
    if (task?.projectId) {
      crumbs = [
        ['采集项目', '/collection/project'],
        ['项目详情', `/collection/project/${task.projectId}`],
        ['任务详情'],
      ]
    }
  }

  const convertedMatch = pathname.match(/^\/dataset\/self\/([^/]+)\/converted\/.+/)
  if (convertedMatch) {
    const datasetId = convertedMatch[1]
    crumbs = [
      ['数据集管理'],
      ['真机数据集', '/dataset/self'],
      ['数据集详情', `/dataset/self/${datasetId}`],
      ['转换数据集详情'],
    ]
  }

  if (!crumbs?.length) return null

  return (
    <div className="flex items-center text-sm text-gray-500">
      <span className="shrink-0 text-gray-600">当前位置：</span>
      {crumbs.map(([label, link], i) => (
        <span key={`${label}-${i}`} className="flex items-center">
          {i > 0 && <span className="mx-1.5 text-gray-300">/</span>}
          {link ? (
            <Link to={link} className="text-gray-500 transition hover:text-blue-600">
              {label}
            </Link>
          ) : (
            <span className={i === crumbs.length - 1 ? 'text-blue-600' : 'text-gray-500'}>
              {label}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
