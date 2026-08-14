import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import ListPageCard, { ListPageFilter } from '../../components/common/ListPageCard'
import Button from '../../components/common/Button'
import { PermButton } from '../../components/common/PermissionAction'
import { IconPlus } from '../../components/common/Icons'
import { useToast } from '../../components/common/Toast'
import { useCurrentNickname } from '../../context/AuthContext'
import { boundEditTip } from '../../utils/taskBindingTips'
import { getSceneTypeTree, setSceneTypeTree } from '../../mock/tags'
import { LIST_PAGE_SIZE } from '../../hooks/usePagination'
import { dtCol, nowDateTime } from '../../utils/formatDateTime'
import SceneTypeModal from './SceneTypeModal'
import { isSceneTypeBoundToTask } from '../../mock/tasks'
import TagTableActions, { useTagRowActions } from './TagTableActions'

const saveMoment = () => nowDateTime()

const isNewId = (id) => String(id).startsWith('sub-') || String(id).startsWith('tag-')

function deepCloneTree(tree) {
  return tree.map((scene) => ({
    ...scene,
    subScenes: scene.subScenes.map((sub) => ({
      ...sub,
      tags: sub.tags.map((tag) => ({ ...tag })),
    })),
  }))
}

function sceneMatches(scene, nameQ, valueQ) {
  if (!nameQ && !valueQ) return true
  const hitName = nameQ && scene.name.includes(nameQ)
  const hitValue = valueQ && (scene.value?.includes(valueQ) || scene.name.includes(valueQ))
  if (hitName || hitValue) return true
  return scene.subScenes.some((sub) => {
    if (nameQ && sub.name.includes(nameQ)) return true
    return sub.tags.some((tag) => {
      const tagValue = tag.value ?? tag.name
      if (nameQ && tag.name.includes(nameQ)) return true
      if (valueQ && tagValue.includes(valueQ)) return true
      return false
    })
  })
}

/** 与顶栏当前登录用户一致，由调用方传入 */
function mergeItemMeta({ isNew, nameChanged, oldItem, saveTime, currentUser }) {
  if (isNew) {
    return {
      creator: currentUser,
      createdAt: saveTime,
      updatedAt: saveTime,
    }
  }
  if (nameChanged) {
    return {
      creator: oldItem.creator,
      createdAt: oldItem.createdAt,
      updatedAt: saveTime,
    }
  }
  return {
    creator: oldItem.creator,
    createdAt: oldItem.createdAt,
    updatedAt: oldItem.updatedAt,
  }
}

function formToScene(form, existingScene, currentUser) {
  const saveTime = saveMoment()
  const isNewScene = !existingScene
  const sceneId = existingScene?.id ?? `SC-${String(Date.now()).slice(-6)}`

  const sceneName = form.name.trim()
  const sceneValue = form.value.trim()
  const sceneDesc = form.description.trim()
  const sceneMetaChanged = isNewScene
    || existingScene.name !== sceneName
    || (existingScene.value ?? '') !== sceneValue
    || (existingScene.description ?? '') !== sceneDesc

  const oldSubMap = new Map()
  const oldTagMap = new Map()
  existingScene?.subScenes.forEach((sub) => {
    oldSubMap.set(sub.id, sub)
    sub.tags.forEach((tag) => oldTagMap.set(tag.id, { sub, tag }))
  })

  const subScenes = form.subTags.map((subRow, si) => {
    const subIsNew = isNewId(subRow.id)
    const oldSub = oldSubMap.get(subRow.id)
    const subId = oldSub?.id ?? `${sceneId}-${String(si + 1).padStart(2, '0')}`
    const subName = subRow.name.trim()
    const subValue = subRow.value.trim()
    const subNameChanged = subIsNew || !oldSub || oldSub.name !== subName
    const subValueChanged = subIsNew || !oldSub || (oldSub.value ?? '') !== subValue

    const subMeta = mergeItemMeta({
      isNew: subIsNew,
      nameChanged: subNameChanged || subValueChanged,
      oldItem: oldSub,
      saveTime,
      currentUser,
    })

    const tags = subRow.children.map((child, ti) => {
      const tagIsNew = isNewId(child.id)
      const oldPair = oldTagMap.get(child.id)
      const oldTag = oldPair?.tag
      const tagId = tagIsNew ? `${sceneId}-T${si + 1}-${ti + 1}` : child.id
      const tagName = child.name.trim()
      const tagValue = child.value.trim()
      const tagChanged = tagIsNew || !oldTag
        || oldTag.name !== tagName
        || (oldTag.value ?? oldTag.name) !== tagValue

      const tagMeta = mergeItemMeta({
        isNew: tagIsNew,
        nameChanged: tagChanged,
        oldItem: oldTag,
        saveTime,
        currentUser,
      })

      return {
        id: tagId,
        name: tagName,
        value: tagValue,
        ...tagMeta,
      }
    })

    return {
      id: subId,
      name: subName,
      value: subValue,
      ...subMeta,
      tags,
    }
  })

  return {
    id: sceneId,
    name: sceneName,
    value: sceneValue,
    description: sceneDesc,
    creator: isNewScene ? currentUser : existingScene.creator,
    createdAt: isNewScene ? saveTime : existingScene.createdAt,
    updatedAt: isNewScene || sceneMetaChanged ? saveTime : existingScene.updatedAt,
    subScenes,
  }
}

function buildVisibleRows(scenes, expanded, nameQ, valueQ) {
  const rows = []
  const filtered = nameQ || valueQ ? scenes.filter((s) => sceneMatches(s, nameQ, valueQ)) : scenes
  const autoExpand = Boolean(nameQ || valueQ)

  filtered.forEach((scene) => {
    rows.push({
      id: scene.id,
      level: 1,
      rowType: 'scene',
      name: scene.name,
      value: scene.value ?? '—',
      description: scene.description,
      creator: scene.creator,
      createdAt: scene.createdAt,
      updatedAt: scene.updatedAt,
      hasChildren: scene.subScenes.length > 0,
      sceneRef: scene,
    })

    const sceneExpanded = autoExpand || expanded.has(scene.id)
    if (!sceneExpanded) return

    scene.subScenes.forEach((sub) => {
      if (nameQ || valueQ) {
        const sceneHit = (nameQ && scene.name.includes(nameQ)) || (valueQ && (scene.value?.includes(valueQ) || scene.name.includes(valueQ)))
        const subHit = (nameQ && sub.name.includes(nameQ)) || (valueQ && sub.name.includes(valueQ))
        const tagHit = sub.tags.some((t) => (nameQ && t.name.includes(nameQ)) || (valueQ && t.name.includes(valueQ)))
        if (!sceneHit && !subHit && !tagHit) return
      }

      rows.push({
        id: sub.id,
        level: 2,
        rowType: 'subScene',
        name: sub.name,
        value: sub.value ?? '—',
        description: '—',
        creator: sub.creator,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        hasChildren: sub.tags.length > 0,
        sceneRef: scene,
      })

      const subExpanded = autoExpand || expanded.has(sub.id)
      if (!subExpanded) return

      sub.tags.forEach((tag) => {
        if (nameQ || valueQ) {
          const sceneHit = (nameQ && scene.name.includes(nameQ)) || (valueQ && (scene.value?.includes(valueQ) || scene.name.includes(valueQ)))
          const subHit = (nameQ && sub.name.includes(nameQ)) || (valueQ && sub.name.includes(valueQ))
          const tagHit = (nameQ && tag.name.includes(nameQ)) || (valueQ && tag.name.includes(valueQ))
          if (!sceneHit && !subHit && !tagHit) return
        }
        rows.push({
          id: tag.id,
          level: 3,
          rowType: 'tag',
          name: tag.name,
          value: tag.value ?? tag.name,
          description: '—',
          creator: tag.creator,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
          hasChildren: false,
          sceneRef: scene,
        })
      })
    })
  })

  return rows
}

function ExpandToggle({ expanded, hasChildren, onClick }) {
  if (!hasChildren) return <span className="mr-1.5 inline-block w-5 shrink-0" />
  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-1.5 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-gray-300 bg-white text-xs font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600"
    >
      {expanded ? '−' : '+'}
    </button>
  )
}

export default function SceneTypePanel() {
  const creatorName = useCurrentNickname()
  const [tree, setTree] = useState(() => deepCloneTree(getSceneTypeTree()))
  const [expanded, setExpanded] = useState(() => new Set())
  const [nameQuery, setNameQuery] = useState('')
  const [valueQuery, setValueQuery] = useState('')
  const [appliedName, setAppliedName] = useState('')
  const [appliedValue, setAppliedValue] = useState('')
  const { ToastNode, show: showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingScene, setEditingScene] = useState(null)

  const syncTree = (next) => {
    setTree(next)
    setSceneTypeTree(next)
  }

  const visibleRows = useMemo(
    () => buildVisibleRows(tree, expanded, appliedName, appliedValue),
    [tree, expanded, appliedName, appliedValue],
  )

  const pageResetKey = `${appliedName}|${appliedValue}|${tree.length}`

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreate = () => {
    setEditingScene(null)
    setModalOpen(true)
  }

  const openEdit = (scene) => {
    setEditingScene(scene)
    setModalOpen(true)
  }

  const { deleteConfirmModal, tryEdit, tryDelete } = useTagRowActions({
    isBound: (row) => isSceneTypeBoundToTask(row.sceneRef),
    getEntityName: (row) => row.name,
    showToast,
    onEdit: (row) => openEdit(row.sceneRef),
    onDelete: (row) => syncTree(tree.filter((s) => s.id !== row.sceneRef.id)),
  })

  const handleSave = (form) => {
    if (editingScene && isSceneTypeBoundToTask(editingScene)) {
      showToast(boundEditTip(editingScene.name))
      return
    }
    const nextScene = formToScene(form, editingScene, creatorName)
    if (editingScene) {
      syncTree(tree.map((s) => (s.id === editingScene.id ? nextScene : s)))
    } else {
      syncTree([nextScene, ...tree])
    }
    setModalOpen(false)
    setEditingScene(null)
  }

  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      render: (_, row) => {
        const indent = row.level === 1 ? 0 : row.level === 2 ? 20 : 40
        return (
          <div className="flex min-w-0 items-center" style={{ paddingLeft: indent }}>
            <ExpandToggle
              hasChildren={row.hasChildren}
              expanded={expanded.has(row.id)}
              onClick={() => toggleExpand(row.id)}
            />
            <span className="truncate font-bold text-gray-800">{row.name}</span>
          </div>
        )
      },
    },
    {
      title: '标签值',
      dataIndex: 'value',
      render: (v) => <span className="text-gray-600">{v || '—'}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      wrap: true,
      render: (_, row) => {
        const text = row.level === 1 ? (row.description || '—') : '—'
        return (
          <span className="max-w-xs truncate block text-gray-500" title={text}>
            {text}
          </span>
        )
      },
    },
    { title: '创建人', dataIndex: 'creator', render: (v) => <span className="text-gray-600">{v || '—'}</span> },
    dtCol('创建时间', 'createdAt'),
    dtCol('更新时间', 'updatedAt'),
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => {
        if (row.level !== 1) return null
        return (
          <TagTableActions
            onEdit={() => tryEdit(row)}
            onDelete={() => tryDelete(row)}
          />
        )
      },
    },
  ]

  return (
    <ListPageCard>
      <ListPageFilter>
      <div className="flex items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">标签名称</label>
            <input
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="输入标签名称"
              className="h-8 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">标签值</label>
            <input
              value={valueQuery}
              onChange={(e) => setValueQuery(e.target.value)}
              placeholder="输入标签值"
              className="h-8 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <Button onClick={() => { setNameQuery(''); setValueQuery(''); setAppliedName(''); setAppliedValue('') }}>重置</Button>
          <Button variant="primary" onClick={() => { setAppliedName(nameQuery); setAppliedValue(valueQuery) }}>查询</Button>
        </div>
        <PermButton permission="tag.create" variant="primary" icon={<IconPlus />} onClick={openCreate}>新建</PermButton>
      </div>
      </ListPageFilter>

      <Table embedded columns={columns} dataSource={visibleRows} pageSize={LIST_PAGE_SIZE} pageResetKey={pageResetKey} />

      <SceneTypeModal
        open={modalOpen}
        scene={editingScene}
        onCancel={() => { setModalOpen(false); setEditingScene(null) }}
        onOk={handleSave}
      />

      {deleteConfirmModal}
      {ToastNode}
    </ListPageCard>
  )
}
