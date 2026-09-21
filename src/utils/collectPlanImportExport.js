import {
  appendPlan,
  getPlansByProjectId,
  nextPlanId,
} from '../mock/plans'
import {
  emptyCreatePlan,
  planToForm,
  buildPlanPayloadFromForm,
} from '../components/collect/CollectPlanForm'
import { nowDateTime } from './formatDateTime'

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null))
}

export function buildCollectPlanExportPayload(plan) {
  const form = planToForm(plan)
  return {
    exportType: 'collectPlan',
    exportedAt: nowDateTime(),
    basicInfo: {
      name: plan.name,
      sceneLabel: plan.sceneLabel,
      scenePath: plan.scenePath ? { ...plan.scenePath } : null,
      deviceTypeId: plan.deviceTypeId,
      deviceTypeName: plan.deviceTypeName,
      method: plan.method,
    },
    actionTemplate: {
      initialScene: plan.initialScene ?? '',
      steps: cloneJson(form.steps),
      totalDeviation: form.totalDeviation,
      durationMin: plan.durationMin,
      durationMax: plan.durationMax,
    },
    annotation: {
      annotTemplateId: plan.annotTemplateId ?? '',
      annotGenConfig: form.annotGenConfig,
      annotPreLabel: form.annotPreLabel,
      fragmentAnnotTypes: cloneJson(plan.fragmentAnnotTypes ?? form.fragmentAnnotTypes ?? []),
    },
  }
}

export function collectPlanExportFilename(plan) {
  const slug = String(plan.name ?? plan.id ?? 'plan').slice(0, 40)
  return `collect-plan-${plan.id ?? 'export'}-${slug}.json`
}

function uniqueImportPlanName(projectId, rawName) {
  const stripped = String(rawName ?? '导入方案').replace(/_副本\d*$/u, '').trim() || '导入方案'
  const names = new Set(getPlansByProjectId(projectId).map((p) => p.name))
  let candidate = `${stripped}_副本`
  if (!names.has(candidate)) return candidate
  let n = 2
  while (names.has(`${stripped}_副本${n}`)) n += 1
  return `${stripped}_副本${n}`
}

export function isCollectPlanImportPayload(data) {
  if (!data || typeof data !== 'object') return false
  if (data.exportType === 'collectPlan') return true
  const hasName = Boolean(data.basicInfo?.name ?? data.name)
  const steps = data.actionTemplate?.steps ?? data.steps
  return hasName && Array.isArray(steps)
}

export function importCollectPlanFromPayload(projectId, payload, creatorName) {
  if (!isCollectPlanImportPayload(payload)) {
    return { ok: false, message: '不是有效的采集方案导出文件' }
  }

  const basic = payload.basicInfo ?? payload
  const action = payload.actionTemplate ?? payload
  const annot = payload.annotation ?? payload
  const scenePath = basic.scenePath ?? payload.scenePath

  const form = {
    ...emptyCreatePlan(),
    name: uniqueImportPlanName(projectId, basic.name ?? payload.name),
    sceneId: scenePath?.sceneId ?? '',
    subSceneId: scenePath?.subSceneId ?? '',
    tagId: scenePath?.tagId ?? '',
    deviceTypeId: basic.deviceTypeId ?? payload.deviceTypeId ?? '',
    method: basic.method ?? payload.method ?? '',
    initialScene: action.initialScene ?? payload.initialScene ?? '',
    steps: cloneJson(action.steps ?? payload.steps ?? [{ description: '', atomicSkills: [], duration: '' }]),
    totalDeviation: action.totalDeviation ?? payload.totalDeviation ?? '',
    annotTemplateId: annot.annotTemplateId ?? payload.annotTemplateId ?? '',
    annotGenConfig: annot.annotGenConfig ?? payload.annotGenConfig ?? true,
    annotPreLabel: annot.annotPreLabel ?? payload.annotPreLabel ?? true,
    fragmentAnnotTypes: cloneJson(annot.fragmentAnnotTypes ?? payload.fragmentAnnotTypes ?? []),
  }

  const now = nowDateTime()
  const planPayload = buildPlanPayloadFromForm(form)
  appendPlan({
    id: nextPlanId(),
    projectId,
    ...planPayload,
    taskCount: 0,
    status: '草稿',
    creator: creatorName,
    createdAt: now,
    updatedAt: now,
  })

  return { ok: true }
}
