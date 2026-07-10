import { canProjectMutate, getProjectMutateDisabledTip } from '../../utils/projectStatus'

/** 项目关闭/归档时置灰并 Tooltip，开启时正常渲染子元素 */
export default function ProjectMutateGate({ projectStatus, children, className = 'inline-flex' }) {
  if (canProjectMutate(projectStatus)) return children

  const tip = getProjectMutateDisabledTip(projectStatus)
  return (
    <span className={`group relative ${className}`}>
      <span className="pointer-events-none inline-flex opacity-40">{children}</span>
      {tip && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow group-hover:block">
          {tip}
        </span>
      )}
    </span>
  )
}
