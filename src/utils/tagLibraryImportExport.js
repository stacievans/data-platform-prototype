import { nowDateTime } from './formatDateTime'
import {
  getAtomicSkillTags,
  setAtomicSkillTags,
  getBodyTypeTags,
  setBodyTypeTags,
  getCollectionMethodTags,
  setCollectionMethodTags,
  getEndTypeTags,
  setEndTypeTags,
  getSceneTypeTree,
  setSceneTypeTree,
  getTaskPurposeTags,
  setTaskPurposeTags,
  getAuditTemplates,
  isAuditTemplateNameTaken,
  nextAuditTemplateId,
  upsertAuditTemplate,
} from '../mock/tags'

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function nextFlatTagId(prefix, existing) {
  const nums = existing
    .map((t) => {
      const m = String(t.id).match(new RegExp(`^${prefix}-(\\d+)$`))
      return m ? parseInt(m[1], 10) : 0
    })
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

function mergeFlatTagList(existing, incoming, idPrefix, creatorName) {
  let added = 0
  let skipped = 0
  const names = new Set(existing.map((t) => t.name))
  const next = [...existing]
  const now = nowDateTime()

  for (const item of incoming ?? []) {
    const name = item?.name?.trim()
    if (!name) continue
    if (names.has(name)) {
      skipped += 1
      continue
    }
    names.add(name)
    next.push({
      ...item,
      id: nextFlatTagId(idPrefix, next),
      name,
      value: item.value ?? name,
      creator: creatorName,
      createdAt: now,
      updatedAt: now,
    })
    added += 1
  }

  return { next, added, skipped }
}

function mergeSceneTypeTree(existing, incoming, creatorName) {
  let added = 0
  let skipped = 0
  const tree = cloneJson(existing)
  const now = nowDateTime()

  for (const incScene of incoming ?? []) {
    const sceneName = incScene?.name?.trim()
    if (!sceneName) continue
    let scene = tree.find((s) => s.name === sceneName)
    if (!scene) {
      tree.push({
        ...incScene,
        id: `SC-${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
        name: sceneName,
        creator: creatorName,
        createdAt: now,
        updatedAt: now,
        subScenes: (incScene.subScenes ?? []).map((sub) => ({
          ...sub,
          id: sub.id?.startsWith('SC-') ? `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : (sub.id ?? `sub-${Date.now()}`),
          creator: creatorName,
          createdAt: now,
          updatedAt: now,
          tags: (sub.tags ?? []).map((tag) => ({
            ...tag,
            id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            creator: creatorName,
            createdAt: now,
            updatedAt: now,
          })),
        })),
      })
      added += 1 + (incScene.subScenes ?? []).reduce((n, sub) => n + 1 + (sub.tags?.length ?? 0), 0)
      continue
    }

    for (const incSub of incScene.subScenes ?? []) {
      const subName = incSub?.name?.trim()
      if (!subName) continue
      let sub = scene.subScenes?.find((s) => s.name === subName)
      if (!sub) {
        if (!scene.subScenes) scene.subScenes = []
        scene.subScenes.push({
          ...incSub,
          id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: subName,
          creator: creatorName,
          createdAt: now,
          updatedAt: now,
          tags: (incSub.tags ?? []).map((tag) => ({
            ...tag,
            id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            creator: creatorName,
            createdAt: now,
            updatedAt: now,
          })),
        })
        added += 1 + (incSub.tags?.length ?? 0)
        continue
      }

      for (const incTag of incSub.tags ?? []) {
        const tagName = incTag?.name?.trim()
        if (!tagName) continue
        if (sub.tags?.some((t) => t.name === tagName)) {
          skipped += 1
          continue
        }
        if (!sub.tags) sub.tags = []
        sub.tags.push({
          ...incTag,
          id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: tagName,
          creator: creatorName,
          createdAt: now,
          updatedAt: now,
        })
        added += 1
      }
    }
  }

  return { tree, added, skipped }
}

function mergeAuditTemplates(incoming, creatorName) {
  let added = 0
  let skipped = 0
  const now = nowDateTime()

  for (const tpl of incoming ?? []) {
    const name = tpl?.name?.trim()
    if (!name) continue
    if (isAuditTemplateNameTaken(name)) {
      skipped += 1
      continue
    }
    upsertAuditTemplate({
      id: nextAuditTemplateId(),
      name,
      description: tpl.description ?? '',
      taskCount: 0,
      creator: creatorName,
      createdAt: now,
      updatedAt: now,
      deleted: false,
      tagTree: cloneJson(tpl.tagTree ?? []),
    })
    added += 1
  }

  return { added, skipped }
}

export const FLAT_TAG_KIND_META = {
  taskPurpose: { prefix: 'TP', exportFilename: 'task-purpose-tags.json', label: '任务用途标签' },
  collectionMethod: { prefix: 'CM', exportFilename: 'collection-method-tags.json', label: '采集方式标签' },
  atomicSkill: { prefix: 'SK', exportFilename: 'atomic-skill-tags.json', label: '原子技能标签' },
  bodyType: { prefix: 'BT', exportFilename: 'body-type-tags.json', label: '本体机型标签' },
  endType: { prefix: 'ET', exportFilename: 'end-type-tags.json', label: '末端类型标签' },
}

export function buildFlatTagExport(kind, items) {
  const meta = FLAT_TAG_KIND_META[kind]
  return {
    exportType: 'tagFlatList',
    tagKind: kind,
    tagLabel: meta?.label,
    exportedAt: nowDateTime(),
    items: cloneJson(items),
  }
}

export function importFlatTagExport(kind, payload, creatorName, getData, setData) {
  const meta = FLAT_TAG_KIND_META[kind]
  if (!meta) return { ok: false, message: '未知的标签类型' }

  let items = null
  if (payload?.exportType === 'tagFlatList') {
    if (payload.tagKind && payload.tagKind !== kind) {
      return { ok: false, message: `文件属于「${FLAT_TAG_KIND_META[payload.tagKind]?.label ?? payload.tagKind}」，请在本 Tab 导入对应类型` }
    }
    items = payload.items
  } else if (Array.isArray(payload?.items)) {
    items = payload.items
  } else if (Array.isArray(payload?.[kind])) {
    items = payload[kind]
  } else if (Array.isArray(payload)) {
    items = payload
  }

  if (!Array.isArray(items)) {
    return { ok: false, message: `不是有效的${meta.label}导出文件` }
  }

  const merged = mergeFlatTagList(getData(), items, meta.prefix, creatorName)
  setData(merged.next)
  return { ok: true, added: merged.added, skipped: merged.skipped }
}

export function buildSceneTypeTreeExport(tree) {
  return {
    exportType: 'sceneTypeTree',
    exportedAt: nowDateTime(),
    sceneTypeTree: cloneJson(tree),
  }
}

export function importSceneTypeTreeExport(payload, creatorName) {
  let incoming = null
  if (payload?.exportType === 'sceneTypeTree') {
    incoming = payload.sceneTypeTree
  } else if (Array.isArray(payload?.sceneTypeTree)) {
    incoming = payload.sceneTypeTree
  } else if (Array.isArray(payload)) {
    incoming = payload
  }

  if (!Array.isArray(incoming)) {
    return { ok: false, message: '不是有效的场景标签导出文件' }
  }

  const scene = mergeSceneTypeTree(getSceneTypeTree(), incoming, creatorName)
  setSceneTypeTree(scene.tree)
  return { ok: true, added: scene.added, skipped: scene.skipped }
}

export function buildAuditTemplatesExport(templates) {
  return {
    exportType: 'auditTagLibrary',
    exportedAt: nowDateTime(),
    templates: (templates ?? getAuditTemplates()).map((t) => ({
      name: t.name,
      description: t.description,
      tagTree: cloneJson(t.tagTree ?? []),
    })),
  }
}

export function buildSingleAuditTemplateExport(template) {
  return buildAuditTemplatesExport([template])
}

export function auditTemplateExportFilename(template) {
  const slug = String(template?.name ?? template?.id ?? 'template').slice(0, 32)
  return `audit-template-${template?.id ?? 'export'}-${slug}.json`
}

export function buildCollectTagLibraryExport() {
  return {
    exportType: 'collectTagLibrary',
    exportedAt: nowDateTime(),
    taskPurpose: cloneJson(getTaskPurposeTags()),
    collectionMethod: cloneJson(getCollectionMethodTags()),
    sceneTypeTree: cloneJson(getSceneTypeTree()),
    atomicSkill: cloneJson(getAtomicSkillTags()),
  }
}

export function buildDeviceTagLibraryExport() {
  return {
    exportType: 'deviceTagLibrary',
    exportedAt: nowDateTime(),
    bodyType: cloneJson(getBodyTypeTags()),
    endType: cloneJson(getEndTypeTags()),
  }
}

export function buildAuditTagLibraryExport() {
  return {
    exportType: 'auditTagLibrary',
    exportedAt: nowDateTime(),
    templates: getAuditTemplates().map((t) => ({
      name: t.name,
      description: t.description,
      tagTree: cloneJson(t.tagTree ?? []),
    })),
  }
}

export function isCollectTagLibraryPayload(data) {
  return data?.exportType === 'collectTagLibrary'
    || (Array.isArray(data?.taskPurpose) && Array.isArray(data?.sceneTypeTree))
}

export function isDeviceTagLibraryPayload(data) {
  return data?.exportType === 'deviceTagLibrary'
    || (Array.isArray(data?.bodyType) && Array.isArray(data?.endType))
}

export function isAuditTagLibraryPayload(data) {
  return data?.exportType === 'auditTagLibrary' || Array.isArray(data?.templates)
}

export function importCollectTagLibrary(payload, creatorName) {
  if (!isCollectTagLibraryPayload(payload)) {
    return { ok: false, message: '不是有效的采集标签导出文件' }
  }
  let added = 0
  let skipped = 0

  const tp = mergeFlatTagList(getTaskPurposeTags(), payload.taskPurpose, 'TP', creatorName)
  setTaskPurposeTags(tp.next)
  added += tp.added
  skipped += tp.skipped

  const cm = mergeFlatTagList(getCollectionMethodTags(), payload.collectionMethod, 'CM', creatorName)
  setCollectionMethodTags(cm.next)
  added += cm.added
  skipped += cm.skipped

  const sk = mergeFlatTagList(getAtomicSkillTags(), payload.atomicSkill, 'SK', creatorName)
  setAtomicSkillTags(sk.next)
  added += sk.added
  skipped += sk.skipped

  const scene = mergeSceneTypeTree(getSceneTypeTree(), payload.sceneTypeTree, creatorName)
  setSceneTypeTree(scene.tree)
  added += scene.added
  skipped += scene.skipped

  return { ok: true, added, skipped }
}

export function importDeviceTagLibrary(payload, creatorName) {
  if (!isDeviceTagLibraryPayload(payload)) {
    return { ok: false, message: '不是有效的设备标签导出文件' }
  }
  let added = 0
  let skipped = 0

  const bt = mergeFlatTagList(getBodyTypeTags(), payload.bodyType, 'BT', creatorName)
  setBodyTypeTags(bt.next)
  added += bt.added
  skipped += bt.skipped

  const et = mergeFlatTagList(getEndTypeTags(), payload.endType, 'ET', creatorName)
  setEndTypeTags(et.next)
  added += et.added
  skipped += et.skipped

  return { ok: true, added, skipped }
}

export function importAuditTagLibrary(payload, creatorName) {
  if (!isAuditTagLibraryPayload(payload)) {
    return { ok: false, message: '不是有效的审核模板导出文件' }
  }
  const { added, skipped } = mergeAuditTemplates(payload.templates, creatorName)
  return { ok: true, added, skipped }
}
