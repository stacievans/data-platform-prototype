import { useMemo, useState } from 'react'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import { PermButton } from '../../components/common/PermissionAction'
import Modal from '../../components/common/Modal'
import { CreatorReadonlyField } from '../../components/common/FormField'
import { useCurrentNickname } from '../../context/AuthContext'
import { sceneTypeTree as initialTree } from '../../mock/tags'
import SceneTypeModal from './SceneTypeModal'
import TagTableActions from './TagTableActions'

const saveMoment = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

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

function sceneMatches(scene, query) {
  if (!query) return true
  if (scene.name.includes(query)) return true
  return scene.subScenes.some(
    (sub) => sub.name.includes(query) || sub.tags.some((tag) => tag.name.includes(query)),
  )
}

function countCascade(scene) {
  const subCount = scene.subScenes.length
  const tagCount = scene.subScenes.reduce((n, sub) => n + sub.tags.length, 0)
  return { subCount, tagCount }
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
  const sceneDesc = form.description.trim()
  const sceneMetaChanged = isNewScene
    || existingScene.name !== sceneName
    || (existingScene.description ?? '') !== sceneDesc

  const oldSubMap = new Map()
  existingScene?.subScenes.forEach((sub) => {
    oldSubMap.set(sub.id, sub)
  })

  const subScenes = form.subScenes.map((sub, si) => {
    const subIsNew = isNewId(sub.id)
    const oldSub = oldSubMap.get(sub.id)
    const subId = subIsNew
      ? `${sceneId}-${String(si + 1).padStart(2, '0')}`
      : sub.id
    const subName = sub.name.trim()
    const subNameChanged = subIsNew || !oldSub || oldSub.name !== subName

    const oldTagMap = new Map()
    oldSub?.tags.forEach((tag) => oldTagMap.set(tag.id, tag))

    const tags = sub.tags.map((tag, ti) => {
      const tagIsNew = isNewId(tag.id)
      const oldTag = oldTagMap.get(tag.id)
      const tagId = tagIsNew
        ? `${sceneId}-T${si + 1}-${ti + 1}`
        : tag.id
      const tagName = tag.name.trim()
      const tagNameChanged = tagIsNew || !oldTag || oldTag.name !== tagName
      const meta = mergeItemMeta({
        isNew: tagIsNew,
        nameChanged: tagNameChanged,
        oldItem: oldTag,
        saveTime,
        currentUser,
      })
      return { id: tagId, name: tagName, ...meta }
    })

    const subMeta = mergeItemMeta({
      isNew: subIsNew,
      nameChanged: subNameChanged,
      oldItem: oldSub,
      saveTime,
      currentUser,
    })

    return { id: subId, name: subName, ...subMeta, tags }
  })

  return {
    id: sceneId,
    name: sceneName,
    description: sceneDesc,
    creator: isNewScene ? currentUser : existingScene.creator,
    createdAt: isNewScene ? saveTime : existingScene.createdAt,
    updatedAt: isNewScene || sceneMetaChanged ? saveTime : existingScene.updatedAt,
    subScenes,
  }
}

function buildVisibleRows(scenes, expanded, query) {
  const rows = []
  const filtered = query ? scenes.filter((s) => sceneMatches(s, query)) : scenes
  const autoExpand = Boolean(query)

  filtered.forEach((scene) => {
    rows.push({
      id: scene.id,
      level: 1,
      rowType: 'scene',
      name: scene.name,
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
      if (query && !sub.name.includes(query) && !sub.tags.some((t) => t.name.includes(query)) && !scene.name.includes(query)) {
        return
      }

      rows.push({
        id: sub.id,
        level: 2,
        rowType: 'subScene',
        name: sub.name,
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
        if (query && !tag.name.includes(query) && !sub.name.includes(query) && !scene.name.includes(query)) {
          return
        }
        rows.push({
          id: tag.id,
          level: 3,
          rowType: 'tag',
          name: tag.name,
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
  const [tree, setTree] = useState(() => deepCloneTree(initialTree))
  const [expanded, setExpanded] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const [applied, setApplied] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingScene, setEditingScene] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const visibleRows = useMemo(
    () => buildVisibleRows(tree, expanded, applied),
    [tree, expanded, applied],
  )

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

  const handleSave = (form) => {
    const nextScene = formToScene(form, editingScene, creatorName)
    if (editingScene) {
      setTree((list) => list.map((s) => (s.id === editingScene.id ? nextScene : s)))
    } else {
      setTree((list) => [nextScene, ...list])
    }
    setModalOpen(false)
    setEditingScene(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setTree((list) => list.filter((s) => s.id !== deleteTarget.id))
    setDeleteTarget(null)
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
            <span className="truncate font-medium text-gray-800">{row.name}</span>
          </div>
        )
      },
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
    { title: '创建人', dataIndex: 'creator' },
    { title: '创建时间', dataIndex: 'createdAt' },
    { title: '最后更新', dataIndex: 'updatedAt' },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) => {
        if (row.level !== 1) return null
        return (
          <TagTableActions
            onEdit={() => openEdit(row.sceneRef)}
            onDelete={() => setDeleteTarget(row.sceneRef)}
          />
        )
      },
    },
  ]

  const { subCount, tagCount } = deleteTarget ? countCascade(deleteTarget) : { subCount: 0, tagCount: 0 }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex flex-1 items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">名称</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入名称搜索"
              className="h-8 w-44 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <Button onClick={() => { setQuery(''); setApplied('') }}>重置</Button>
          <Button variant="primary" onClick={() => setApplied(query)}>查询</Button>
        </div>
        <PermButton permission="tag.create" variant="primary" onClick={openCreate}>+ 新建标签</PermButton>
      </div>

      <Table columns={columns} dataSource={visibleRows} />

      <SceneTypeModal
        open={modalOpen}
        scene={editingScene}
        onCancel={() => { setModalOpen(false); setEditingScene(null) }}
        onOk={handleSave}
      />

      <Modal
        open={!!deleteTarget}
        title="删除场景"
        onCancel={() => setDeleteTarget(null)}
        onOk={confirmDelete}
        okText="确定删除"
        width={480}
      >
        <p className="text-sm leading-relaxed text-gray-600">
          确定删除场景「<strong className="text-gray-800">{deleteTarget?.name}</strong>」？
          将同时级联删除 <strong className="text-red-600">{subCount}</strong> 个子场景和{' '}
          <strong className="text-red-600">{tagCount}</strong> 个标签，此操作不可恢复。
        </p>
      </Modal>
    </div>
  )
}
