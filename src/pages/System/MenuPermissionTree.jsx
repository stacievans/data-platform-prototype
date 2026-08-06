import { useMemo, useState } from 'react'
import { ACTION_LABELS, buildAllPermissionKeys, permissionCatalog } from '../../mock/permissions'
import { IndeterminateCheckbox } from '../../components/common/CheckboxList'
import { IconChevronDown } from '../../components/common/Icons'

const CHECKBOX_CLS = 'h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-gray-300 accent-blue-600'
const ROW_HEIGHT = 28

function buildActionNodes(moduleId, actions) {
  return actions
    .filter((action) => action !== 'view')
    .map((action) => ({
      id: `${moduleId}.${action}`,
      name: ACTION_LABELS[action] ?? action,
      nodeType: 'action',
      permissionKey: `${moduleId}.${action}`,
    }))
}

function buildMenuNode(leaf) {
  return {
    id: leaf.id,
    name: leaf.name,
    nodeType: 'menu',
    permissionKey: `${leaf.id}.view`,
    children: buildActionNodes(leaf.id, leaf.actions),
  }
}

function buildTree(catalog) {
  return catalog.map((group) => {
    if (group.children) {
      return {
        id: group.id,
        name: group.name,
        nodeType: 'directory',
        children: group.children.map((leaf) => buildMenuNode(leaf)),
      }
    }
    return buildMenuNode(group)
  })
}

function collectPermissionKeys(node) {
  const keys = node.permissionKey ? [node.permissionKey] : []
  for (const child of node.children ?? []) {
    keys.push(...collectPermissionKeys(child))
  }
  return keys
}

function getNodeCheckState(node, selected, parentChildLinkage) {
  const keys = collectPermissionKeys(node)

  if (parentChildLinkage) {
    if (keys.length === 0) return { checked: false, indeterminate: false }
    const selectedCount = keys.filter((k) => selected.has(k)).length
    return {
      checked: selectedCount === keys.length,
      indeterminate: selectedCount > 0 && selectedCount < keys.length,
    }
  }

  if (node.permissionKey) {
    return { checked: selected.has(node.permissionKey), indeterminate: false }
  }

  if (keys.length === 0) return { checked: false, indeterminate: false }
  const selectedCount = keys.filter((k) => selected.has(k)).length
  return {
    checked: selectedCount === keys.length,
    indeterminate: false,
  }
}

function collectExpandableIds(nodes) {
  return nodes.flatMap((node) => {
    const childIds = collectExpandableIds(node.children ?? [])
    if ((node.children?.length ?? 0) > 0 && node.nodeType !== 'action') {
      return [node.id, ...childIds]
    }
    return childIds
  })
}

export function normalizeRolePermissions(keys) {
  let result = [...keys]
  const modules = new Set(keys.map((k) => k.slice(0, k.lastIndexOf('.'))))
  modules.forEach((mod) => {
    const viewKey = `${mod}.view`
    const hasOther = keys.some((k) => k.startsWith(`${mod}.`) && !k.endsWith('.view'))
    if (hasOther && !result.includes(viewKey)) result.push(viewKey)
  })
  return result
}

function nodeTypeLabel(nodeType) {
  if (nodeType === 'directory') return '目录'
  if (nodeType === 'menu') return '菜单'
  return '按钮'
}

function TreeNode({
  node,
  depth,
  expanded,
  selected,
  parentChildLinkage,
  onToggleExpand,
  onToggleSelect,
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isExpanded = expanded.has(node.id)
  const { checked, indeterminate } = getNodeCheckState(node, selected, parentChildLinkage)

  const handleToggle = () => {
    onToggleSelect(node, !checked)
  }

  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded px-1 hover:bg-gray-50"
        style={{ minHeight: ROW_HEIGHT, paddingLeft: depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center text-gray-400"
          >
            <IconChevronDown className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}
        <IndeterminateCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={handleToggle}
          className={CHECKBOX_CLS}
        />
        <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{node.name}</span>
        {node.nodeType !== 'action' && (
          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
            {nodeTypeLabel(node.nodeType)}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && node.children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          selected={selected}
          parentChildLinkage={parentChildLinkage}
          onToggleExpand={onToggleExpand}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
}

export default function MenuPermissionTree({ value = [], onChange }) {
  const tree = useMemo(() => buildTree(permissionCatalog), [])
  const allKeys = useMemo(() => buildAllPermissionKeys(), [])
  const expandableIds = useMemo(() => collectExpandableIds(tree), [tree])
  const selected = useMemo(() => new Set(value), [value])
  const [expanded, setExpanded] = useState(() => new Set())
  const [parentChildLinkage, setParentChildLinkage] = useState(false)

  const allExpanded = expandableIds.length > 0 && expandableIds.every((id) => expanded.has(id))
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k))
  const someSelected = allKeys.some((k) => selected.has(k)) && !allSelected

  const toggleExpandAll = () => {
    setExpanded(allExpanded ? new Set() : new Set(expandableIds))
  }

  const toggleSelectAll = () => {
    onChange(allSelected ? [] : [...allKeys])
  }

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelect = (node, checked) => {
    const next = new Set(value)
    if (parentChildLinkage) {
      const keys = collectPermissionKeys(node)
      keys.forEach((k) => {
        if (checked) next.add(k)
        else next.delete(k)
      })
    } else if (node.permissionKey) {
      if (checked) next.add(node.permissionKey)
      else next.delete(node.permissionKey)
    } else {
      const keys = collectPermissionKeys(node)
      keys.forEach((k) => {
        if (checked) next.add(k)
        else next.delete(k)
      })
    }
    onChange([...next])
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 px-3 py-2 text-sm text-gray-600">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className={CHECKBOX_CLS}
            checked={allExpanded}
            onChange={toggleExpandAll}
          />
          展开/折叠
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <IndeterminateCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleSelectAll}
            className={CHECKBOX_CLS}
          />
          全选/全不选
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className={CHECKBOX_CLS}
            checked={parentChildLinkage}
            onChange={(e) => setParentChildLinkage(e.target.checked)}
          />
          父子联动
        </label>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            expanded={expanded}
            selected={selected}
            parentChildLinkage={parentChildLinkage}
            onToggleExpand={toggleExpand}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  )
}
